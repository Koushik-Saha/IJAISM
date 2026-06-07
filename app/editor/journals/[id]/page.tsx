'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import FileUploadButton from "@/components/ui/FileUploadButton";

export default function EditJournalPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [formData, setFormData] = useState({
        code: '',
        fullName: '',
        description: '',
        coverImageUrl: '',
        issn: '',
        impactFactor: '',
        displayOrder: '0',
        isActive: true
    });

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [editors, setEditors] = useState<any[]>([]);
    const [allEditors, setAllEditors] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('assistant_editor');
    const [isSubmittingEditor, setIsSubmittingEditor] = useState(false);

    useEffect(() => {
        if (id) {
            fetchJournal();
            fetchJournalEditors();
            fetchAllSystemEditors();
        }
        
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => setCurrentUser(data.user || null))
                .catch(err => console.error(err));
        }
    }, [id]);

    const fetchJournal = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/editor/journals/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to fetch journal');
            const data = await response.json();
            const journal = data.journal;

            setFormData({
                code: journal.code,
                fullName: journal.fullName,
                description: journal.description || '',
                coverImageUrl: journal.coverImageUrl || '',
                issn: journal.issn || '',
                impactFactor: journal.impactFactor || '',
                displayOrder: journal.displayOrder.toString(),
                isActive: journal.isActive,
            });
        } catch (err) {
            toast.error('Error loading journal');
            router.push('/editor/journals');
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/editor/journals/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update journal');
            }

            toast.success('Journal updated successfully');
            router.push('/editor/journals');
        } catch (err: any) {
            toast.error('Failed to update journal', {
                description: err.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchJournalEditors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/editor/journals/${id}/editors`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setEditors(data.editors || []);
            }
        } catch (err) {
            console.error("Error loading journal editors", err);
        }
    };

    const fetchAllSystemEditors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/editor/users?role=editor&limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setAllEditors(data.users || []);
            }
        } catch (err) {
            console.error("Error loading system editors", err);
        }
    };

    const handleAddEditor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) {
            toast.error("Please select a user");
            return;
        }
        setIsSubmittingEditor(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/editor/journals/${id}/editors`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: selectedUserId,
                    role: selectedRole
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to add editor");
            }

            toast.success("Editor added successfully");
            fetchJournalEditors();
            setSelectedUserId('');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmittingEditor(false);
        }
    };

    const handleRemoveEditor = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this editor?")) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/editor/journals/${id}/editors?userId=${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to remove editor");
            }

            toast.success("Editor removed successfully");
            fetchJournalEditors();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h1 className="text-3xl font-bold text-primary">Edit Journal</h1>
                        <div className="flex items-center gap-3">
                            <Link href="/editor/journals" className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
                                ← Back
                            </Link>
                            <Link href={`/editor/journals/${id}/issues`} className="btn-primary bg-indigo-600 hover:bg-indigo-700 font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 text-sm">
                                📚 Manage Issues
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Journal Code (Required)
                            </label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Display Order
                            </label>
                            <input
                                type="number"
                                className="input-field"
                                value={formData.displayOrder}
                                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name (Required)
                            </label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                rows={4}
                                className="input-field"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ISSN
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.issn}
                                onChange={(e) => setFormData({ ...formData, issn: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Impact Factor
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="input-field"
                                value={formData.impactFactor}
                                onChange={(e) => setFormData({ ...formData, impactFactor: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cover Image
                            </label>
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <div className="w-24 h-32 bg-gray-200 rounded-lg border flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
                                    {formData.coverImageUrl ? (
                                        <img src={formData.coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[10px] text-gray-400 font-bold uppercase px-1 text-center">No Cover</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <FileUploadButton
                                        onUploadSuccess={(url) => setFormData({ ...formData, coverImageUrl: url })}
                                        accept="image/*"
                                        label={formData.coverImageUrl ? "Change Image" : "Upload Image"}
                                        fileType="journal"
                                    />
                                    {formData.coverImageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, coverImageUrl: '' })}
                                            className="block text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                                        >
                                            Remove Image
                                        </button>
                                    )}
                                    <p className="text-[10px] text-gray-500">Recommended: Portrait aspect ratio (3:4 or A4). Max 10MB.</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-700">Active (Visible to public)</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                {currentUser && ['super_admin', 'mother_admin'].includes(currentUser.role) && (
                    <div className="bg-white rounded-lg shadow-md p-6 mt-8 space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-3">Manage Editorial Board</h2>
                        
                        <form onSubmit={handleAddEditor} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Editor
                                </label>
                                <select
                                    className="input-field"
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Editor --</option>
                                    {allEditors.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.email}) — {u.role.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select
                                    className="input-field"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    required
                                >
                                    <option value="editor_in_chief">Editor-in-Chief</option>
                                    <option value="assistant_editor">Assistant Editor</option>
                                    <option value="editorial_board_member">Editorial Board Member</option>
                                </select>
                            </div>
                            
                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmittingEditor}
                                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 h-[42px]"
                                >
                                    {isSubmittingEditor ? 'Adding...' : 'Add to Board'}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Editorial Board</h3>
                            {editors.length === 0 ? (
                                <p className="text-gray-500 text-sm italic">No editors assigned to this journal board yet.</p>
                            ) : (
                                <div className="border rounded-lg overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                            {editors.map((editor) => (
                                                <tr key={editor.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-950">{editor.user.name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{editor.user.email}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                            editor.role === 'editor_in_chief' ? 'bg-purple-100 text-purple-800' :
                                                            editor.role === 'assistant_editor' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                            {editor.role === 'editor_in_chief' ? 'Editor-in-Chief' :
                                                             editor.role === 'assistant_editor' ? 'Assistant Editor' :
                                                             'Editorial Board Member'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveEditor(editor.userId)}
                                                            className="text-red-600 hover:text-red-800 font-medium text-xs"
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
