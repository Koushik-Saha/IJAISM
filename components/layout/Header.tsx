"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  Squares2X2Icon,
  UserIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import AuthModal from "@/components/ui/AuthModal";

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSubmitClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setIsAuthModalOpen(true);
      if (isMenuOpen) setIsMenuOpen(false);
    }
  };

  // Check authentication status on mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const loginTime = localStorage.getItem('loginTime');
      const MAX_SESSION_TIME = 2 * 60 * 60 * 1000; // 2 hours

      // Check for session timeout
      if (loginTime && Date.now() - parseInt(loginTime) > MAX_SESSION_TIME) {
        handleLogout();
        return;
      }

      if (token) {
        try {
          // Decode JWT token to get user info
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));

          // Check if token is expired
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            // Token expired, clear it
            handleLogout();
          } else {
            // Token valid, set user info
            setUser({
              userId: payload.userId,
              email: payload.email,
              name: payload.name || payload.email.split('@')[0],
              role: payload.role,
            });
            // Set login time if not present
            if (!loginTime) {
              localStorage.setItem('loginTime', Date.now().toString());
            }
          }
        } catch (error) {
          console.error('Error decoding token:', error);
          handleLogout();
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
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    setUser(null);
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);

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
              Dissertation/Thesis
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

            <Link
              href="/submit"
              onClick={handleSubmitClick}
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap px-1"
            >
              Submit
            </Link>

            {!isLoading && (
              <>
                {user ? (
                  // Logged in: User Dropdown (Headless UI)
                  <Menu as="div" className="relative ml-3">
                    <MenuButton className="w-[12rem] justify-end flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-sm font-medium text-gray-700 hidden xl:block max-w-[100px] truncate">
                        {user.name}
                      </span>
                      <ChevronDownIcon className="w-4 h-4 text-gray-500" aria-hidden="true" />
                    </MenuButton>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <MenuItems
                        className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 origin-top-right border border-gray-100"
                      >
                        <div className="px-4 py-3 bg-gray-50 rounded-lg mb-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 font-medium truncate">{user.email}</p>

                        </div>

                        <div className="space-y-1">
                          <MenuItem>
                            {({ active }) => (
                              <Link
                                href="/dashboard"
                                className={`${active ? 'bg-primary/5 text-primary' : 'text-gray-700'
                                  } group flex items-center gap-4 px-4 py-3 text-[15px] font-medium rounded-xl transition-all duration-200`}
                              >
                                <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${active ? 'text-primary bg-primary/10' : 'text-gray-400 bg-gray-100/50'
                                  }`}>
                                  <Squares2X2Icon className="w-5 h-5" />
                                </div>
                                Dashboard
                              </Link>
                            )}
                          </MenuItem>
                          <MenuItem>
                            {({ active }) => (
                              <Link
                                href="/dashboard/profile"
                                className={`${active ? 'bg-primary/5 text-primary' : 'text-gray-700'
                                  } group flex items-center gap-4 px-4 py-3 text-[15px] font-medium rounded-xl transition-all duration-200`}
                              >
                                <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${active ? 'text-primary bg-primary/10' : 'text-gray-400 bg-gray-100/50'
                                  }`}>
                                  <UserIcon className="w-5 h-5" />
                                </div>
                                My Profile
                              </Link>
                            )}
                          </MenuItem>
                          {user.role === 'reviewer' && (
                            <MenuItem>
                              {({ active }) => (
                                <Link
                                  href="/dashboard/reviews"
                                  className={`${active ? 'bg-primary/5 text-primary' : 'text-gray-700'
                                    } group flex items-center gap-4 px-4 py-3 text-[15px] font-medium rounded-xl transition-all duration-200`}
                                >
                                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${active ? 'text-primary bg-primary/10' : 'text-gray-400 bg-gray-100/50'
                                    }`}>
                                    <ClipboardDocumentListIcon className="w-5 h-5" />
                                  </div>
                                  Review Assignments
                                </Link>
                              )}
                            </MenuItem>
                          )}
                          <MenuItem>
                            {({ active }) => (
                              <Link
                                href="/membership"
                                className={`${active ? 'bg-primary/5 text-primary' : 'text-gray-700'
                                  } group flex items-center gap-4 px-4 py-3 text-[15px] font-medium rounded-xl transition-all duration-200`}
                              >
                                <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${active ? 'text-primary bg-primary/10' : 'text-gray-400 bg-gray-100/50'
                                  }`}>
                                  <CreditCardIcon className="w-5 h-5" />
                                </div>
                                Membership
                              </Link>
                            )}
                          </MenuItem>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-100/50">
                          <MenuItem>
                            {({ active }) => (
                              <button
                                onClick={handleLogout}
                                className={`${active ? 'bg-red-50 text-red-700' : 'text-red-600'
                                  } group flex w-full items-center gap-4 px-4 py-3 text-[15px] font-medium rounded-xl transition-all duration-200`}
                              >
                                <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${active ? 'text-red-600 bg-red-100' : 'text-red-500 bg-red-50'
                                  }`}>
                                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                </div>
                                Sign Out
                              </button>
                            )}
                          </MenuItem>
                        </div>
                      </MenuItems>
                    </Transition>
                  </Menu>
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
                onClick={handleSubmitClick}
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Start Your Submission"
        description="To maintain the quality and integrity of our peer-review process, we require all authors to log in before submitting an article. This ensures you can track your submission status and communicate effectively with our editors."
      />
    </header >
  );
}
