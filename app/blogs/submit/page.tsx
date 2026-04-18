'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BlogSubmissionForm from '@/components/blog/BlogSubmissionForm';
import Link from 'next/link';

export default function BlogSubmitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic auth check
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (!token || !userData) {
      router.push('/login?callbackUrl=/blogs/submit');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary animate-pulse">Checking authentication...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16 mb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-blue-100">
              <li>
                <Link href="/blogs" className="hover:text-white transition-colors">Blogs</Link>
              </li>
              <li className="flex items-center space-x-2">
                <span>/</span>
                <span className="font-semibold text-white">Submit Blog</span>
              </li>
            </ol>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Submit Your Blog</h1>
          <p className="text-xl text-blue-50 max-w-2xl">
            Share your research, insights, and stories with the C5K community. Our editors will review your submission before publication.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlogSubmissionForm />
      </div>
    </div>
  );
}
