interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <div
      className={`card ${hover ? 'hover:scale-[1.02]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
