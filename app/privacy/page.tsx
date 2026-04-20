import React from 'react';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PrivacyPolicy() {
    const settings = await prisma.globalSettings.findMany({
        where: { key: { in: ['site_name', 'privacy_policy'] } }
    });

    const siteName = settings.find(s => s.key === 'site_name')?.value || 'C5K';
    const content = settings.find(s => s.key === 'privacy_policy')?.value || '<p>Privacy policy content coming soon...</p>';
    const updatedAt = settings.find(s => s.key === 'privacy_policy')?.updatedAt || new Date();

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                    <p className="text-gray-500 mb-8 pb-4 border-b">Last updated: {updatedAt.toLocaleDateString()}</p>

                    <article 
                        className="prose prose-blue max-w-none"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            </div>
        </div>
    );
}
