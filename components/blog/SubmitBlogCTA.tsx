'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/ui/AuthModal';

export default function SubmitBlogCTA() {
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    setIsAuthenticated(!!(token && userData));
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      router.push('/blogs/submit');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center px-8 py-4 bg-accent text-white font-bold rounded-xl shadow-lg border-2 border-accent hover:bg-transparent hover:border-white transition-all transform hover:-translate-y-1 active:scale-95 group"
      >
        <span>Submit Your Blog</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Share Your Perspective"
        description="To maintain the quality of the C5K insights blog, we require authors to sign in before submitting. This allows you to track your editorial reviews and manage your contributions seamlessly."
      />
    </>
  );
}
