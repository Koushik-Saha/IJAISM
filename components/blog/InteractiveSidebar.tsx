'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InteractiveSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/blogs?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleCategoryClick = (category: string) => {
    router.push(`/blogs?q=${encodeURIComponent(category)}`);
  };

  const topics = [
    { name: 'Accessibility', icon: '🌐' },
    { name: 'Blogging', icon: '📝' },
    { name: 'Communication', icon: '💬' },
    { name: 'Developer Tools', icon: '⚙️' },
    { name: 'Entertainment', icon: '🎮' },
    { name: 'News & Weather', icon: '📰' },
    { name: 'Photos', icon: '📸' },
    { name: 'Productivity', icon: '📊' },
    { name: 'Search Tools', icon: '🔍' },
    { name: 'Shopping', icon: '🛒' },
    { name: 'Social', icon: '👥' },
    { name: 'Sports', icon: '🏅' }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Search Box */}
      <div className="bg-white border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for blogs..." 
            className="flex-1 bg-gray-50 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#007398]" 
          />
          <button type="submit" className="bg-[#007398] text-white px-5 py-2 text-sm font-semibold hover:bg-[#005a78] transition">Search</button>
        </form>
      </div>

      {/* Extensions (Categories) Grid */}
      <div className="bg-white border border-gray-200 p-6">
         <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Topics & Categories</div>
         <div className="grid grid-cols-2 gap-y-4 gap-x-2">
           {topics.map(topic => (
             <div 
               key={topic.name} 
               onClick={() => handleCategoryClick(topic.name)}
               className="flex items-center gap-2 cursor-pointer group"
             >
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-sm">{topic.icon}</div>
                <span className="text-xs font-semibold text-blue-600 group-hover:underline truncate">{topic.name}</span>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
