"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4 lg:space-x-6 xl:space-x-8">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
              Home
            </Link>
            <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
              About
            </Link>
            <Link href="/journals" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
              Academic Journals
            </Link>
            <Link href="/dissertations" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
              Dissertation/Thesis
            </Link>
            <Link href="/books" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
              Books
            </Link>
            <Link href="/conferences" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
              Conferences
            </Link>
            <Link href="/announcements" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
              Announcements
            </Link>
          </nav>

          {/* Desktop User Actions */}
          <div className="hidden lg:flex items-center space-x-3 lg:space-x-4 xl:space-x-6 flex-shrink-0 ml-4">
            <Link href="/membership" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
              Membership
            </Link>
            <Link href="/submit" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
              Submit Article
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
              Sign In
            </Link>
            <Link href="/register" className="bg-accent text-white px-4 py-2 rounded font-bold hover:bg-accent-dark transition-colors text-sm whitespace-nowrap">
              JOIN IJAISM
            </Link>
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
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
