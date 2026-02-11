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
  ArrowRightOnRectangleIcon,
  HeartIcon
} from "@heroicons/react/24/outline";
import AuthModal from "@/components/ui/AuthModal";
import NotificationBell from "@/components/ui/NotificationBell";

interface UserInfo {
  userId: string;
  email: string;
  name?: string;
  role: string;
  profileImageUrl?: string;
}

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(0);
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
              profileImageUrl: payload.profileImageUrl,
            });
            // Set login time if not present
            if (!loginTime) {
              localStorage.setItem('loginTime', Date.now().toString());
            }
            fetchWishlistCount(token);
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

    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      const token = localStorage.getItem('token');
      if (token) fetchWishlistCount(token);
    };
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);

    // Listen for storage events (login/logout in other tabs)
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('userLoggedIn', checkAuth);
      window.removeEventListener('userLoggedOut', checkAuth);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
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

  const fetchWishlistCount = async (token: string) => {
    try {
      const res = await fetch('/api/dashboard/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.wishlist) {
          setWishlistCount(data.data.wishlist.length);
        }
      }
    } catch (error) {
      console.error("Failed to fetch wishlist count", error);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200 w-full">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="flex items-center gap-3 mr-4 lg:mr-8">
              <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
                <Image src="/logo.png" alt="C5K Logo" fill className="object-contain" />
              </div>
              <div className="hidden sm:block">
                <div className="text-lg md:text-xl font-bold text-primary leading-tight mb-0.5">C5K</div>
                <div className="text-xs text-gray-600 leading-tight">Advanced Info Systems</div>
              </div>
              <div className="sm:hidden text-xl font-bold text-primary">C5K</div>
            </div>
          </Link>

          {/* Search Bar - Centered & Responsive */}
          <div className="hidden md:flex flex-1 max-w-lg mx-auto px-4 lg:px-8">
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
              className="w-full relative group"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-all duration-200"
              />
            </form>
          </div>

          {/* Right Section: Navigation & Actions */}
          <div className="flex items-center justify-end gap-1 md:gap-2">

            {/* Desktop Nav Links - Visible on large screens */}
            <nav className="hidden lg:flex items-center gap-1 mr-2">
              <Link href="/journals" className="px-2 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">
                Journals
              </Link>
              <Link href="/dissertations" className="px-2 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">
                Dissertation/Thesis
              </Link>
              <Link href="/books" className="px-2 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">
                Books
              </Link>
              <Link href="/conferences" className="px-2 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">
                Conferences
              </Link>
              <Link href="/announcements" className="px-2 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">
                Announcements
              </Link>
              <Link href="/submit" onClick={handleSubmitClick} className="px-2 py-2 rounded-full text-sm font-medium text-primary hover:bg-primary/5 transition-colors whitespace-nowrap">
                Submit
              </Link>
            </nav>

            {!isLoading && (
              <div className="flex items-center gap-2 md:gap-3">

                {/* Submit Action (Mobile/Tablet friendly) */}
                <Link
                  href="/submit"
                  onClick={handleSubmitClick}
                  className="xl:hidden p-2 text-gray-600 hover:text-primary transition-colors"
                  aria-label="Submit Article"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>

                {user ? (
                  <>
                    {/* Wishlist Icon */}
                    <Link href="/dashboard/wishlist" className="p-2 text-gray-600 hover:text-primary transition-colors relative group">
                      <HeartIcon className="w-6 h-6" />
                      {wishlistCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                          {wishlistCount}
                        </span>
                      )}
                      <span className="absolute hidden group-hover:block top-full right-0 mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                        Wishlist
                      </span>
                    </Link>

                    <NotificationBell />

                    {/* User Menu - Avatar Only (Instagram Style) */}
                    <Menu as="div" className="relative ml-1">
                      <MenuButton className="flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform active:scale-95">
                        <span className="sr-only">Open user menu</span>
                        {user.profileImageUrl ? (
                          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-gray-200">
                            <Image
                              src={user.profileImageUrl || "/placeholder-user.jpg"}
                              alt={user.name || "User"}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-md hover:shadow-lg transition-shadow">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
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
                          className="absolute right-0 mt-2 w-72 min-w-[18rem] bg-white rounded-2xl shadow-xl py-2 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 origin-top-right border border-gray-100 divide-y divide-gray-100"
                        >
                          <div className="px-4 py-3">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 font-medium truncate">{user.email}</p>
                          </div>

                          {/* Mobile/Tablet Navigation Links (Visible in dropdown) */}
                          <div className="xl:hidden py-1 border-b border-gray-100">
                            <MenuItem>
                              <Link href="/journals" className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                                Journals
                              </Link>
                            </MenuItem>
                            <MenuItem>
                              <Link href="/dissertations" className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                                Dissertation/Thesis
                              </Link>
                            </MenuItem>
                            <MenuItem>
                              <Link href="/books" className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                                Books
                              </Link>
                            </MenuItem>
                            <MenuItem>
                              <Link href="/conferences" className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                                Conferences
                              </Link>
                            </MenuItem>
                            <MenuItem>
                              <Link href="/announcements" className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                                Announcements
                              </Link>
                            </MenuItem>
                            <MenuItem>
                              <Link href="/submit" onClick={handleSubmitClick} className="group flex items-center px-4 py-2 text-sm text-primary font-medium hover:bg-primary/5 transition-colors">
                                Submit Article
                              </Link>
                            </MenuItem>
                          </div>

                          <div className="py-1">
                            <MenuItem>
                              {({ active }) => (
                                <Link
                                  href="/dashboard"
                                  className={`${active ? 'bg-gray-50' : ''
                                    } group flex items-center px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 transition-colors gap-3`}
                                >
                                  <Squares2X2Icon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                  Dashboard
                                </Link>
                              )}
                            </MenuItem>
                            <MenuItem>
                              {({ active }) => (
                                <Link
                                  href="/dashboard/profile"
                                  className={`${active ? 'bg-gray-50' : ''
                                    } group flex items-center px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 transition-colors gap-3`}
                                >
                                  <UserIcon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                  My Profile
                                </Link>
                              )}
                            </MenuItem>
                            {user.role === 'reviewer' && (
                              <MenuItem>
                                <Link
                                  href="/dashboard/reviews"
                                  className="group flex items-center px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors gap-3"
                                >
                                  <ClipboardDocumentListIcon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                  Review Assignments
                                </Link>
                              </MenuItem>
                            )}
                          </div>

                          <div className="py-1">
                            <MenuItem>
                              <Link
                                href="/membership"
                                className="group flex items-center px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors gap-3"
                              >
                                <CreditCardIcon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                Membership
                              </Link>
                            </MenuItem>
                            <MenuItem>
                              <Link
                                href="/about"
                                className="group flex items-center px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors gap-3"
                              >
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                About
                              </Link>
                            </MenuItem>
                          </div>

                          <div className="py-1">
                            <MenuItem>
                              {({ active }) => (
                                <button
                                  onClick={handleLogout}
                                  className={`${active ? 'bg-red-50 text-red-700' : 'text-gray-700'
                                    } w-full text-left group flex items-center px-4 py-2.5 text-sm transition-colors gap-3`}
                                >
                                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                                  Sign Out
                                </button>
                              )}
                            </MenuItem>
                          </div>
                        </MenuItems>
                      </Transition>
                    </Menu>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                      Log In
                    </Link>
                    <Link href="/register" className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-blue-700 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button - Visible up to XL screens */}
          <button
            className="xl:hidden p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
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
          <div className="xl:hidden border-t border-gray-200 py-4 pb-6 animate-fade-in">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/"
                className="text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
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
                        JOIN C5K
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
