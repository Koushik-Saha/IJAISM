"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Card from "@/components/ui/Card";

type Section = {
    id: string;
    type: string;
    title: string;
    content: any;
    displayOrder: number;
    isActive: boolean;
};

const SECTION_TYPES = {
    hero_carousel: "Hero Carousel",
    announcements: "Latest Announcements",
    journals: "Academic Journals",
    latest_articles: "Latest Articles",
    most_viewed: "Most Viewed Articles",
    newsletter: "Newsletter Subscription",
    stats: "Platform Statistics",
    html: "Custom HTML Block",
    text: "Rich Text Block"
};

export default function HomepageManager() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSection, setCurrentSection] = useState<Partial<Section>>({});
    const router = useRouter();

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/homepage-sections', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSections(data.data);
            }
        } catch (error) {
            toast.error("Failed to load sections");
        } finally {
            setLoading(false);
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newSections.length) return;

        // Swap
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];

        // Update displayOrder locally
        newSections.forEach((s, i) => s.displayOrder = i);
        setSections(newSections);

        // Save order
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/admin/homepage-sections', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sections: newSections.map(s => ({ id: s.id, displayOrder: s.displayOrder }))
                })
            });
            toast.success("Order updated");
        } catch (error) {
            toast.error("Failed to save order");
            fetchSections(); // Revert
        }
    };

    const handleToggle = async (section: Section) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/homepage-sections/${section.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: !section.isActive })
            });

            if (res.ok) {
                setSections(sections.map(s => s.id === section.id ? { ...s, isActive: !s.isActive } : s));
                toast.success(section.isActive ? "Section hidden" : "Section visible");
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/homepage-sections/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setSections(sections.filter(s => s.id !== id));
                toast.success("Section deleted");
            }
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const url = currentSection.id
                ? `/api/admin/homepage-sections/${currentSection.id}`
                : '/api/admin/homepage-sections';

            const method = currentSection.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(currentSection)
            });

            if (res.ok) {
                toast.success("Section saved");
                setIsEditing(false);
                setCurrentSection({});
                fetchSections();
            } else {
                toast.error("Failed to save");
            }
        } catch (error) {
            toast.error("Error saving section");
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Homepage Layout Manager</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setCurrentSection({ type: 'html', isActive: true }); setIsEditing(true); }}
                        className="btn-primary bg-purple-600 hover:bg-purple-700"
                    >
                        + Add Custom HTML
                    </button>
                    <button
                        onClick={() => { setCurrentSection({ type: 'text', isActive: true }); setIsEditing(true); }}
                        className="btn-primary"
                    >
                        + Add Rich Text
                    </button>
                </div>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{currentSection.id ? 'Edit Section' : 'New Section'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Type</label>
                                <select
                                    className="w-full border p-2 rounded bg-gray-100"
                                    value={currentSection.type}
                                    onChange={e => setCurrentSection({ ...currentSection, type: e.target.value })}
                                    disabled={!!currentSection.id} // Cannot change type after create
                                >
                                    {Object.entries(SECTION_TYPES).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Title (Internal Name)</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={currentSection.title || ''}
                                    onChange={e => setCurrentSection({ ...currentSection, title: e.target.value })}
                                    required
                                />
                            </div>

                            {(currentSection.type === 'html' || currentSection.type === 'text') && (
                                <div>
                                    <label className="block text-sm font-medium">Content (HTML/Text)</label>
                                    <textarea
                                        className="w-full border p-2 rounded h-40 font-mono text-sm"
                                        value={currentSection.content?.html || ''}
                                        onChange={e => setCurrentSection({ ...currentSection, content: { html: e.target.value } })}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Save Section</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {sections.map((section, index) => (
                    <Card key={section.id} className={`p-4 flex items-center justify-between ${!section.isActive ? 'opacity-50 bg-gray-50' : ''}`}>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                                <button
                                    disabled={index === 0}
                                    onClick={() => handleMove(index, 'up')}
                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                >
                                    ⬆️
                                </button>
                                <button
                                    disabled={index === sections.length - 1}
                                    onClick={() => handleMove(index, 'down')}
                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                >
                                    ⬇️
                                </button>
                            </div>
                            <div>
                                <h3 className="font-bold flex items-center gap-2">
                                    {section.title}
                                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 rounded">
                                        {Object.entries(SECTION_TYPES).find(([k]) => k === section.type)?.[1] || section.type}
                                    </span>
                                </h3>
                                <div className="text-xs text-gray-400">
                                    Order: {section.displayOrder} • {section.isActive ? 'Visible' : 'Hidden'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleToggle(section)}
                                className={`px-3 py-1 text-sm rounded ${section.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                            >
                                {section.isActive ? 'Hide' : 'Show'}
                            </button>

                            {(section.type === 'html' || section.type === 'text') && (
                                <button
                                    onClick={() => { setCurrentSection(section); setIsEditing(true); }}
                                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                    Edit
                                </button>
                            )}

                            {(section.type === 'html' || section.type === 'text') && (
                                <button
                                    onClick={() => handleDelete(section.id)}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
