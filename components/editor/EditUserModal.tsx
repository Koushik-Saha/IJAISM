
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    university: string | null;
    bio: string | null;
    profileImageUrl: string | null;
}

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
    currentUserRole: string;
}

export default function EditUserModal({ isOpen, onClose, onSuccess, user, currentUserRole }: EditUserModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        university: '',
        bio: '',
        profileImageUrl: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                role: user.role || 'author',
                university: user.university || '',
                bio: user.bio || '',
                profileImageUrl: user.profileImageUrl || '',
            });
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error('Invalid file type. Please upload an image.');
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading('Uploading photo...');

        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('file', file);
            data.append('fileType', 'profile-photos');

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const result = await response.json();
            setFormData(prev => ({ ...prev, profileImageUrl: result.data.url }));
            toast.success('Photo uploaded successfully!', { id: toastId });
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload photo', { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/editor/users', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    ...formData
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update user');
            }

            toast.success('User updated successfully!');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error('Update failed', {
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Edit User Details</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Photo Upload Section */}
                    <div className="flex flex-col items-center gap-4 py-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200 relative">
                                {formData.profileImageUrl ? (
                                    <Image 
                                        src={formData.profileImageUrl} 
                                        alt="Profile" 
                                        fill 
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <CameraIcon className="w-12 h-12" />
                                    </div>
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
                                disabled={isUploading}
                            >
                                <CameraIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                        <p className="text-xs text-blue-600 font-medium tracking-wide uppercase">Profile Photo (AWS S3 Storage)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-tight">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white shadow-sm transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-tight">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white shadow-sm transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-tight">University / Affiliation</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white shadow-sm transition-all"
                                value={formData.university}
                                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-tight">Role</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white shadow-sm transition-all"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="author">Author</option>
                                <option value="reviewer">Reviewer</option>
                                
                                {['mother_admin', 'super_admin'].includes(currentUserRole) && (
                                    <>
                                        <option value="editor">Editor</option>
                                        <option value="sub_editor">Sub Editor</option>
                                        <option value="admin">Admin</option>
                                    </>
                                )}
                                
                                {currentUserRole === 'mother_admin' && (
                                    <option value="super_admin">Super Admin</option>
                                )}

                                {currentUserRole === 'editor' && (
                                    <option value="sub_editor">Sub Editor</option>
                                )}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-tight">Biography</label>
                        <textarea
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white shadow-sm transition-all"
                            placeholder="Academic background, research interests..."
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || isUploading}
                            className="px-8 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            {isLoading ? 'Saving Changes...' : 'Save All Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
