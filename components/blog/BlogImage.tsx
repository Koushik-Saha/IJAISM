"use client";

import { useState } from "react";

interface BlogImageProps {
  src: string | null;
  title: string;
  size?: "normal" | "large" | "mini";
}

export default function BlogImage({ src, title, size = "normal" }: BlogImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    if (size === "large") {
      return (
        <div className="w-full min-h-[250px] bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex flex-col justify-between p-10 text-white relative overflow-hidden rounded">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-16 -top-16 w-48 h-48 bg-white/5 rounded-full blur-xl" />
          
          <div className="flex items-center justify-between z-10">
            <span className="text-xs font-bold tracking-widest bg-white/20 px-3 py-1 rounded uppercase">C5K INSIGHTS ARTICLE</span>
            <svg className="w-8 h-8 opacity-40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <div className="z-10 mt-8">
            <h2 className="font-bold text-xl leading-snug text-white/95">
              {title}
            </h2>
          </div>
        </div>
      );
    }

    if (size === "mini") {
      return (
        <div className="w-full h-full bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex flex-col justify-between p-3 text-white relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-lg" />
          <div className="flex items-center justify-between z-10">
            <span className="text-[8px] font-bold tracking-widest bg-white/20 px-1 rounded uppercase">C5K MINI</span>
            <svg className="w-3 h-3 opacity-30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <div className="z-10 mt-1">
            <h5 className="font-bold text-[10px] leading-tight line-clamp-2 text-white/90">
              {title}
            </h5>
          </div>
        </div>
      );
    }

    // Default "normal"
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex flex-col justify-between p-6 text-white relative overflow-hidden">
        {/* Decorative background shape */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="absolute -left-8 -top-8 w-24 h-24 bg-white/5 rounded-full blur-lg" />
        
        <div className="flex items-center justify-between z-10">
          <span className="text-[10px] font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded uppercase">C5K INSIGHTS</span>
          <svg className="w-5 h-5 opacity-40" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
        <div className="z-10">
          <h4 className="font-bold text-sm leading-snug line-clamp-3 text-white/90">
            {title}
          </h4>
        </div>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={title} 
      className={size === "large" ? "w-full object-cover max-h-[500px]" : "absolute inset-0 w-full h-full object-cover"}
      onError={() => setError(true)}
    />
  );
}
