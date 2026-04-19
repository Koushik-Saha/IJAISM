"use client";

interface IssueCoverImageProps {
  src: string;
  volume: number;
  issue: number;
}

export default function IssueCoverImage({ src, volume, issue }: IssueCoverImageProps) {
  return (
    <img
      src={src}
      className="w-full h-full object-cover"
      alt={`Cover for Vol ${volume}, Issue ${issue}`}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        img.style.display = "none";
        const parent = img.parentElement;
        if (parent) {
          const fallback = document.createElement("span");
          fallback.textContent = `VOL ${volume}`;
          parent.appendChild(fallback);
        }
      }}
    />
  );
}
