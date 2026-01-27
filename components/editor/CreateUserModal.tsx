
import { useState } from 'react';
import { toast } from 'sonner';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentUserRole: string;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess, currentUserRole }: CreateUserModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'author',
        university: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/editor/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create user');
            }

            toast.success('User created successfully!', {
                description: 'Verification email has been sent to the user.',
            });
            onSuccess();
            onClose();
            // Reset form
            setFormData({ name: '', email: '', password: '', role: 'author', university: '' });
        } catch (error: any) {
            toast.error('Failed to create user', {
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">Create New User</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full border rounded px-3 py-2"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full border rounded px-3 py-2"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Temp Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full border rounded px-3 py-2"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">University (Optional)</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            value={formData.university}
                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="author">Author</option>

                            {/* Role Creation Logic based on Current User */}
                            {['mother_admin', 'super_admin'].includes(currentUserRole) && (
                                <>
                                    <option value="reviewer">Reviewer</option>
                                    <option value="editor">Editor</option>
                                    <option value="sub_editor">Sub Editor</option>
                                    <option value="admin">Admin</option>
                                </>
                            )}
                            {/* Mother Admin can verify Super Admin creation via backend, but usually restricted? 
                   Assuming backend handles strict "canCreateRole" checks. 
                   Frontend simplified list.
               */}
                            {currentUserRole === 'mother_admin' && (
                                <option value="super_admin">Super Admin</option>
                            )}

                            {/* Reviewer can only create Author (default option) */}

                            {currentUserRole === 'editor' && (
                                <option value="sub_editor">Sub Editor</option>
                            )}

                        </select>
                        {currentUserRole === 'reviewer' && (
                            <p className="text-xs text-gray-500 mt-1">Reviewers can only create Authors.</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isLoading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
