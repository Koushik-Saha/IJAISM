'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

type Settings = {
    apc_fee: number;
    site_name: string;
    site_logo_url: string;
    site_location: string;
    site_contact_email: string;
    site_contact_phone: string;
    site_mission: string;
    site_vision: string;
    privacy_policy: string;
    terms_conditions: string;
};

const tabs = [
    { id: 'general', name: 'General' },
    { id: 'contact', name: 'Contact' },
    { id: 'content', name: 'Mission & Vision' },
    { id: 'legal', name: 'Legal' },
    { id: 'payment', name: 'Payment' },
];

export default function AdminSettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        apc_fee: 500,
        site_name: '',
        site_logo_url: '',
        site_location: '',
        site_contact_email: '',
        site_contact_phone: '',
        site_mission: '',
        site_vision: '',
        privacy_policy: '',
        terms_conditions: '',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            const res = await fetch('/api/admin/settings', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to fetch settings');

            const data = await res.json();
            setSettings(prev => ({ ...prev, ...data.settings }));
        } catch (error) {
            console.error(error);
            toast.error('Error loading settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (!res.ok) throw new Error('Failed to save settings');

            toast.success('Settings updated successfully');
        } catch (error) {
            console.error(error);
            toast.error('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', 'misc');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setSettings({ ...settings, site_logo_url: data.data.url });
            toast.success('Logo uploaded');
        } catch (err) {
            toast.error('Logo upload failed');
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">Platform Configuration</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Tabs Sidebar */}
                <div className="w-full md:w-64 flex flex-col space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                                activeTab === tab.id 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                    <form onSubmit={handleSave} className="space-y-6">
                        
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                <h2 className="text-xl font-semibold border-b pb-2">Site Identity</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={settings.site_name}
                                        onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., C5K Platform"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                                    <div className="flex items-center gap-4">
                                        {settings.site_logo_url && (
                                            <img src={settings.site_logo_url} alt="Logo" className="h-12 w-auto object-contain bg-gray-50 p-1 rounded border" />
                                        )}
                                        <input
                                            type="file"
                                            onChange={handleLogoUpload}
                                            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            accept="image/*"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                <h2 className="text-xl font-semibold border-b pb-2">Contact & Location</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Office Address</label>
                                    <textarea
                                        rows={3}
                                        value={settings.site_location}
                                        onChange={(e) => setSettings({...settings, site_location: e.target.value})}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                        <input
                                            type="email"
                                            value={settings.site_contact_email}
                                            onChange={(e) => setSettings({...settings, site_contact_email: e.target.value})}
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                        <input
                                            type="text"
                                            value={settings.site_contact_phone}
                                            onChange={(e) => setSettings({...settings, site_contact_phone: e.target.value})}
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                <h2 className="text-xl font-semibold border-b pb-2">Platform Vision</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Our Mission</label>
                                    <div className="bg-white rounded-lg border overflow-hidden">
                                        <ReactQuill 
                                            theme="snow" 
                                            value={settings.site_mission} 
                                            onChange={(val) => {
                                                if (val !== settings.site_mission) {
                                                    setSettings({...settings, site_mission: val});
                                                }
                                            }}
                                            className="min-h-[200px]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Our Vision</label>
                                    <div className="bg-white rounded-lg border overflow-hidden">
                                        <ReactQuill 
                                            theme="snow" 
                                            value={settings.site_vision} 
                                            onChange={(val) => {
                                                if (val !== settings.site_vision) {
                                                    setSettings({...settings, site_vision: val});
                                                }
                                            }}
                                            className="min-h-[200px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'legal' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                <h2 className="text-xl font-semibold border-b pb-2">Legal Compliance</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Policy</label>
                                    <div className="bg-white rounded-lg border overflow-hidden">
                                        <ReactQuill 
                                            theme="snow" 
                                            value={settings.privacy_policy} 
                                            onChange={(val) => {
                                                if (val !== settings.privacy_policy) {
                                                    setSettings({...settings, privacy_policy: val});
                                                }
                                            }}
                                            className="min-h-[300px]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                                    <div className="bg-white rounded-lg border overflow-hidden">
                                        <ReactQuill 
                                            theme="snow" 
                                            value={settings.terms_conditions} 
                                            onChange={(val) => {
                                                if (val !== settings.terms_conditions) {
                                                    setSettings({...settings, terms_conditions: val});
                                                }
                                            }}
                                            className="min-h-[300px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payment' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                <h2 className="text-xl font-semibold border-b pb-2">Financials</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Article Processing Charge (APC) Fee ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.apc_fee}
                                        onChange={(e) => setSettings({...settings, apc_fee: parseFloat(e.target.value)})}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        step="0.01"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        This fee applies to all new article submissions. Standard fee is $500.00.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="pt-8 flex items-center justify-between border-t">
                            <p className="text-sm text-gray-500 italic">Settings are applied instantly across the entire platform.</p>
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                {saving ? 'Applying...' : 'Save All Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
