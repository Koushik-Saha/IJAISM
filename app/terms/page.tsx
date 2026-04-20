import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function TermsPage() {
    const settings = await prisma.globalSettings.findMany({
        where: { key: { in: ['site_name', 'terms_conditions'] } }
    });

    const siteName = settings.find(s => s.key === 'site_name')?.value || 'C5K';
    const content = settings.find(s => s.key === 'terms_conditions')?.value || '<p>Terms and conditions coming soon...</p>';
    const updatedAt = settings.find(s => s.key === 'terms_conditions')?.updatedAt || new Date();

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
                    <h1 className="text-4xl font-bold text-primary mb-2">Terms of Service</h1>
                    <p className="text-gray-500 mb-8 pb-4 border-b">Last updated: {updatedAt.toLocaleDateString()}</p>

                    <article 
                        className="prose prose-blue max-w-none"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                    
                    <div className="mt-12 pt-8 border-t">
                        <p className="text-gray-600">
                            If you have any questions about these Terms, please contact us at{' '}
                            <Link href="/contact" className="text-primary font-bold hover:underline">
                                Our Support Center
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
