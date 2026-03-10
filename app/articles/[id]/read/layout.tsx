export default function ReadArticleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // We render just the children to skip the global Header/Footer in the main layout
    // The main layout applies them, but we can't easily override a parent layout from a child.
    // However, since Next.js app router nests layouts, if we want to remove the global header/footer,
    // we would need route groups. 
    // Since we are inside `app/articles/[id]/read`, it inherits `app/layout.tsx`.
    // To cleanly remove the header/footer, we should actually modify the root layout to conditionally render them,
    // or use a route group like `app/(reader)/read/[id]/page.tsx`.
    // For now, let's just let the Read page sit on top or we can adjust root layout.
    return <>{children}</>;
}
