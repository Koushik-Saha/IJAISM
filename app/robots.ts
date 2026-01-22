import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://c5k-platform.vercel.app';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/admin/', '/dashboard/', '/editor/', '/register', '/login', '/reset-password', '/verify-email', '/forgot-password'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
