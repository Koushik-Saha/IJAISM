
import { useState } from 'react';
import { toast } from 'sonner';
import { KeyIcon, EnvelopeIcon, XMarkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface User {
    id: string;
    name: string;
    email: string;
}

interface ManagePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

export default function ManagePasswordModal({ isOpen, onClose, user }: ManagePasswordModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'selection' | 'manual' | 'email'>('selection');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    if (!isOpen || !user) return null;

    const handleManualReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

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
                    password: newPassword
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update password');
            }

            toast.success('Password updated successfully!', {
                description: 'The user will be forced to change it on their next login.'
            });
            onClose();
            setMode('selection');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error('Update failed', { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailReset = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/editor/users/reset-email', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to send reset email');

            toast.success('Reset email sent!', {
                description: `Instructions have been sent to ${user.email}`
            });
            onClose();
        } catch (error: any) {
            toast.error('Email failed', { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <KeyIcon className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Security Management</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-sm text-amber-800 font-medium">
                            Managing access for <span className="font-bold underline">{user.name}</span>
                        </p>
                    </div>

                    {mode === 'selection' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setMode('manual')}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-primary hover:bg-primary/5 transition-all group"
                            >
                                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-primary/10 transition-colors">
                                    <KeyIcon className="w-6 h-6 text-gray-600 group-hover:text-primary" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Manual Set</h3>
                                    <p className="text-xs text-gray-500">Pick a password yourself for the user</p>
                                </div>
                            </button>

                            <button
                                onClick={handleEmailReset}
                                disabled={isLoading}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50"
                            >
                                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <EnvelopeIcon className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Email Reset Link</h3>
                                    <p className="text-xs text-gray-500">System sends a secure token to user's email</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {mode === 'manual' && (
                        <form onSubmit={handleManualReset} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter at least 8 characters"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat the password"
                                />
                            </div>

                            <div className="flex flex-col gap-2 pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? 'Updating...' : 'Save New Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('selection')}
                                    className="w-full text-sm font-bold text-gray-500 py-2 hover:text-gray-900"
                                >
                                    Back to Options
                                </button>
                            </div>

                            <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-start gap-2 border border-gray-100">
                                <ShieldCheckIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                                <p className="text-[11px] text-gray-600 leading-tight font-medium">
                                    Security Policy: The user will be required to change this password on their next login.
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
