"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth"; // Assuming hook exists or we use context
// If no hook, we'll fetch profile or assume protected layout handles it.
// We'll use local state for now for simplicity.

import Card from "@/components/ui/Card";

type HeroSlide = {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    primaryButtonText?: string;
    primaryButtonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    displayOrder: number;
    isActive: boolean;
};

export default function HeroSlidesManager() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSlide, setCurrentSlide] = useState<Partial<HeroSlide>>({});
    const router = useRouter();

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/editor/hero-slides', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSlides(data.data);
            }
        } catch (error) {
            toast.error("Failed to load slides");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this slide?")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/editor/hero-slides/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Slide deleted");
                fetchSlides();
            } else {
                toast.error("Failed to delete");
            }
        } catch (error) {
            toast.error("Error deleting slide");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const url = currentSlide.id
                ? `/api/editor/hero-slides/${currentSlide.id}`
                : '/api/editor/hero-slides';

            const method = currentSlide.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(currentSlide)
            });

            const data = await res.json();

            if (data.success) {
                toast.success(currentSlide.id ? "Slide updated" : "Slide created");
                setIsEditing(false);
                setCurrentSlide({});
                fetchSlides();
                router.refresh(); // Update the actual homepage cache if needed
            } else {
                toast.error(data.error?.message || "Failed to save");
            }
        } catch (error) {
            toast.error("Error saving slide");
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Homepage Hero Slides</h1>
                <button
                    onClick={() => { setCurrentSlide({ displayOrder: slides.length + 1, isActive: true }); setIsEditing(true); }}
                    className="btn-primary"
                >
                    + Add New Slide
                </button>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{currentSlide.id ? 'Edit Slide' : 'New Slide'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Title *</label>
                                <input
                                    required
                                    className="w-full border p-2 rounded"
                                    value={currentSlide.title || ''}
                                    onChange={e => setCurrentSlide({ ...currentSlide, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Subtitle</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={currentSlide.subtitle || ''}
                                    onChange={e => setCurrentSlide({ ...currentSlide, subtitle: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Description</label>
                                <textarea
                                    className="w-full border p-2 rounded h-24"
                                    value={currentSlide.description || ''}
                                    onChange={e => setCurrentSlide({ ...currentSlide, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Image URL (Optional)</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    placeholder="https://..."
                                    value={currentSlide.imageUrl || ''}
                                    onChange={e => setCurrentSlide({ ...currentSlide, imageUrl: e.target.value })}
                                />
                                <p className="text-xs text-gray-500">To upload an image, go to "Files" page first, upload, and copy URL here.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Primary Button Text</label>
                                    <input
                                        className="w-full border p-2 rounded"
                                        value={currentSlide.primaryButtonText || ''}
                                        onChange={e => setCurrentSlide({ ...currentSlide, primaryButtonText: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Primary Button Link</label>
                                    <input
                                        className="w-full border p-2 rounded"
                                        value={currentSlide.primaryButtonLink || ''}
                                        onChange={e => setCurrentSlide({ ...currentSlide, primaryButtonLink: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Secondary Button Text</label>
                                    <input
                                        className="w-full border p-2 rounded"
                                        value={currentSlide.secondaryButtonText || ''}
                                        onChange={e => setCurrentSlide({ ...currentSlide, secondaryButtonText: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Secondary Button Link</label>
                                    <input
                                        className="w-full border p-2 rounded"
                                        value={currentSlide.secondaryButtonLink || ''}
                                        onChange={e => setCurrentSlide({ ...currentSlide, secondaryButtonLink: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Order</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded"
                                        value={currentSlide.displayOrder || 0}
                                        onChange={e => setCurrentSlide({ ...currentSlide, displayOrder: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="flex items-center mt-6">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={currentSlide.isActive ?? true}
                                        onChange={e => setCurrentSlide({ ...currentSlide, isActive: e.target.checked })}
                                    />
                                    <label>Active</label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Save Slide</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {slides.map(slide => (
                    <Card key={slide.id} className="flex justify-between items-center p-4">
                        <div>
                            <h3 className="font-bold text-lg">{slide.title} {slide.isActive ? <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded">Active</span> : <span className="text-gray-500 text-xs bg-gray-100 px-2 rounded">Inactive</span>}</h3>
                            <p className="text-sm text-gray-600 truncate max-w-md">{slide.description}</p>
                            <div className="text-xs text-gray-400 mt-1">Order: {slide.displayOrder}</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setCurrentSlide(slide); setIsEditing(true); }} className="text-blue-600 hover:text-blue-800">Edit</button>
                            <button onClick={() => handleDelete(slide.id)} className="text-red-600 hover:text-red-800">Delete</button>
                        </div>
                    </Card>
                ))}
                {slides.length === 0 && <div className="text-center text-gray-500 py-8">No slides found. Create one!</div>}
            </div>
        </div>
    );
}
