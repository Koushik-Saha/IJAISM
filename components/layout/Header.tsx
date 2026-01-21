"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UserInfo {
  userId: string;
  email: string;
  name?: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Check authentication status on mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decode JWT token to get user info
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));

          // Check if token is expired
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            // Token expired, clear it
            localStorage.removeItem('token');
            setUser(null);
          } else {
            // Token valid, set user info
            setUser({
              userId: payload.userId,
              email: payload.email,
              name: payload.name || payload.email.split('@')[0],
              role: payload.role,
            });
          }
        } catch (error) {
          console.error('Error decoding token:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage events (login/logout in other tabs)
    window.addEventListener('storage', checkAuth);

    // Listen for custom login event
    window.addEventListener('userLoggedIn', checkAuth);
    window.addEventListener('userLoggedOut', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('userLoggedIn', checkAuth);
      window.removeEventListener('userLoggedOut', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsMenuOpen(false);

    // Dispatch logout event
    window.dispatchEvent(new Event('userLoggedOut'));

    // Show logout toast
    if (typeof window !== 'undefined') {
      const { toast } = require('sonner');
      toast.success('Logged out successfully', {
        description: 'You have been logged out of your account.',
        duration: 3000,
      });
    }

    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200 w-full">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="flex items-center gap-3 mr-4 lg:mr-8">
              <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
                <Image src="/favicon.svg" alt="IJAISM Logo" fill className="object-contain" />
              </div>
              <div className="hidden sm:block">
                <div className="text-lg md:text-xl font-bold text-primary leading-tight mb-0.5">IJAISM</div>
                <div className="text-xs text-gray-600 leading-tight">Advanced Info Systems</div>
              </div>
              <div className="sm:hidden text-xl font-bold text-primary">IJAISM</div>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim().length === 0) {
                  toast.error("Please enter a search term");
                  return;
                }
                router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                setShowSearch(false);
              }}
              className="w-full relative"
            >
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
                className="w-full pl-3 pr-10 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors cursor-pointer z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2 xl:space-x-3">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap px-1">
              Home
            </Link>
            <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap px-1">
              About
            </Link>
            <Link href="/journals" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap px-1">
              Journals
            </Link>
            <Link href="/dissertations" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap px-1">
              Dissertations
            </Link>
            <Link href="/books" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap px-1">
              Books
            </Link>
            <Link href="/conferences" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap px-1">
              Conferences
            </Link>
            <Link href="/announcements" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap px-1">
              Announcements
            </Link>
          </nav>

          {/* Desktop User Actions */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-3 flex-shrink-0 ml-2">
            <Link href="/membership" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap px-1">
              Membership
            </Link>
            <Link href="/submit" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap px-1">
              Submit
            </Link>

            {!isLoading && (
              <>
                {user ? (
                  // Logged in: User Dropdown
                  <div className="relative ml-2">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-sm font-medium text-gray-700 hidden xl:block max-w-[100px] truncate">
                        {user.name}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsUserMenuOpen(false)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-20 animate-fade-in-down origin-top-right border border-gray-100">
                          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>

                          <div className="py-1">
                            <Link
                              href="/dashboard"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                              Dashboard
                            </Link>
                            <Link
                              href="/dashboard/profile"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              My Profile
                            </Link>
                            {user.role === 'reviewer' && (
                              <Link
                                href="/dashboard/reviews"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                Review Assignments
                              </Link>
                            )}
                          </div>

                          <div className="border-t border-gray-100 py-1">
                            <button
                              onClick={handleLogout}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  // Not logged in: Show sign in and join buttons
                  <>
                    <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap px-2">
                      Sign In
                    </Link>
                    <Link href="/register" className="bg-accent text-white px-3 py-1.5 rounded font-bold hover:bg-accent-dark transition-colors text-sm whitespace-nowrap">
                      JOIN IJAISM
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 pb-6 animate-fade-in">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/"
                className="text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/journals"
                className="text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Academic Journals
              </Link>
              <Link
                href="/dissertations"
                className="text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dissertation/Thesis
              </Link>
              <Link
                href="/books"
                className="text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Books
              </Link>
              <Link
                href="/conferences"
                className="text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Conferences
              </Link>
              <Link
                href="/announcements"
                className="text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Announcements
              </Link>

              {/* Divider */}
              <div className="border-t border-gray-200 my-2"></div>

              <Link
                href="/membership"
                className="text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Membership
              </Link>
              <Link
                href="/submit"
                className="text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Submit Article
              </Link>

              {!isLoading && (
                <>
                  {user ? (
                    // Logged in: Show user info and logout
                    <>
                      <Link
                        href="/dashboard"
                        className="text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-2 rounded transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded transition-colors text-left"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    // Not logged in: Show sign in and join buttons
                    <>
                      <Link
                        href="/login"
                        className="text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-2 rounded transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="bg-accent text-white px-6 py-3 rounded font-bold hover:bg-accent-dark transition-colors text-center text-base"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        JOIN IJAISM
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
