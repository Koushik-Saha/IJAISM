"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

export default function JournalNav({ journalCode }: { journalCode: string }) {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const navRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleDropdown = (name: string) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    const navItems = [
        {
            name: "Current Issue",
            items: [
                { label: "Current Issue", href: `/journals/${journalCode}/current` },
                { label: "Article in Press", href: `/journals/${journalCode}/press` },
                { label: "Special Issue", href: `/journals/${journalCode}/special` },
            ],
        },
        {
            name: "Archive",
            items: [
                { label: "All Issues", href: `/journals/${journalCode}/archive` },
                { label: "Best Paper Awards", href: `/journals/${journalCode}/awards` },
            ],
        },
        {
            name: "About",
            items: [
                { label: "Journal Overview", href: `/journals/${journalCode}/overview` },
                { label: "Editorial Board", href: `/journals/${journalCode}/editorial-board` },
                { label: "Language Editing Service", href: `/journals/${journalCode}/editing-service` },
            ],
        },
    ];

    return (
        <div className="bg-[#c05621] text-white shadow-md relative z-20" ref={navRef}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-12">
                    {navItems.map((item) => (
                        <div key={item.name} className="relative group">
                            <button
                                onClick={() => toggleDropdown(item.name)}
                                onMouseEnter={() => setActiveDropdown(item.name)}
                                className="flex items-center px-6 py-3 font-semibold hover:bg-[#a3461a] transition-colors focus:outline-none"
                            >
                                {item.name}
                                <ChevronDownIcon className="w-4 h-4 ml-2" />
                            </button>

                            {activeDropdown === item.name && (
                                <div
                                    className="absolute left-0 top-full w-56 bg-[#0e7490] shadow-lg rounded-b-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                                    onMouseLeave={() => setActiveDropdown(null)}
                                >
                                    {item.items.map((subItem) => (
                                        <Link
                                            key={subItem.label}
                                            href={subItem.href}
                                            className="block px-4 py-3 text-sm text-white hover:bg-[#155e75] transition-colors border-b border-[#155e75] last:border-0"
                                            onClick={() => setActiveDropdown(null)}
                                        >
                                            {subItem.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    <Link
                        href="/submit"
                        className="flex items-center px-6 py-3 font-semibold hover:bg-[#a3461a] transition-colors"
                    >
                        Submit Your Article
                    </Link>

                    <Link
                        href="/author-guidelines"
                        className="flex items-center px-6 py-3 font-semibold hover:bg-[#a3461a] transition-colors"
                    >
                        Guide for Authors
                    </Link>
                </div>
            </div>
        </div>
    );
}
