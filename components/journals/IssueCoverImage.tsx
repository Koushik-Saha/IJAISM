"use client";

import { useState } from "react";

interface IssueCoverImageProps {
  src: string;
  volume: number;
  issue: number;
  className?: string;
}

export function IssueCoverPlaceholder({ volume, className = "" }: { volume: number; className?: string }) {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-200 to-gray-300 select-none ${className}`}>
      <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Vol {volume}</span>
    </div>
  );
}

export default function IssueCoverImage({ src, volume, issue, className = "" }: IssueCoverImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <IssueCoverPlaceholder volume={volume} className={className} />;
  }

  return (
    <img
      src={src}
      className={`w-full h-full object-cover ${className}`}
      alt={`Cover for Vol ${volume}, Issue ${issue}`}
      onError={() => setHasError(true)}
    />
  );
}
