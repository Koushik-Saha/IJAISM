"use client";

import { useState } from "react";
import { toast } from "sonner";
import { track } from "@vercel/analytics";

interface NewsletterSectionProps {
    title?: string | null;
    content?: any;
}

import { useSettings } from '@/context/SettingsContext';

export default function NewsletterSection({ title, content }: NewsletterSectionProps) {
    const { settings } = useSettings();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        // ... omitted ...
    };

    return (
        <section className="py-16 bg-primary text-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl font-bold mb-4">
                    {title || `Subscribe to ${settings.site_name} for Updates`}
                </h2>

                {content?.html ? (
                    <div className="text-lg mb-8" dangerouslySetInnerHTML={{ __html: content.html }} />
                ) : (
                    <p className="text-lg mb-8">
                        Stay informed about the latest research, publications, and academic events.
                    </p>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center">
                    <input
                        type="email"
                        placeholder="Enter your email"
                        className="px-6 py-3 rounded text-gray-900 w-full sm:w-96 focus:outline-none focus:ring-2 focus:ring-accent"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                    />
                    <button
                        type="submit"
                        className="btn-accent disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? "Subscribing..." : "Subscribe"}
                    </button>
                </form>
            </div>
        </section>
    );
}
