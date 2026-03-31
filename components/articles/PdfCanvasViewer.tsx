"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, ChevronUp, ChevronDown, ZoomIn, ZoomOut } from "lucide-react";

interface Props {
    pdfUrl: string;
}

export default function PdfCanvasViewer({ pdfUrl }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.4);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
    const renderingRef = useRef(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfDocRef = useRef<any>(null);

    // Track which pages have been rendered at the current scale
    const renderedAtScale = useRef<Record<number, number>>({});

    useEffect(() => {
        let cancelled = false;

        async function loadPdf() {
            setLoading(true);
            setError(null);

            try {
                const pdfjsLib = await import("pdfjs-dist");
                pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                    "pdfjs-dist/build/pdf.worker.min.mjs",
                    import.meta.url
                ).toString();

                const loadingTask = pdfjsLib.getDocument(pdfUrl);
                const pdf = await loadingTask.promise;

                if (cancelled) return;

                pdfDocRef.current = pdf;
                setNumPages(pdf.numPages);
                canvasRefs.current = Array(pdf.numPages).fill(null);
                renderedAtScale.current = {};
                setLoading(false);
            } catch (err: unknown) {
                if (!cancelled) {
                    setError("Failed to load PDF. Try opening it directly.");
                    setLoading(false);
                    console.error("PDF load error:", err);
                }
            }
        }

        loadPdf();
        return () => { cancelled = true; };
    }, [pdfUrl]);

    // Render pages when canvases are mounted or scale changes
    useEffect(() => {
        if (!pdfDocRef.current || loading) return;

        async function renderAll() {
            if (renderingRef.current) return;
            renderingRef.current = true;

            const pdf = pdfDocRef.current;

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const canvas = canvasRefs.current[pageNum - 1];
                if (!canvas) continue;

                // Skip if already rendered at this scale
                if (renderedAtScale.current[pageNum] === scale) continue;

                try {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale });

                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    const ctx = canvas.getContext("2d");
                    if (!ctx) continue;

                    await page.render({ canvasContext: ctx, viewport }).promise;
                    renderedAtScale.current[pageNum] = scale;
                } catch (e) {
                    console.error(`Error rendering page ${pageNum}:`, e);
                }
            }

            renderingRef.current = false;
        }

        renderAll();
    }, [loading, numPages, scale]);

    // Intersection observer to track current page
    useEffect(() => {
        if (!containerRef.current || numPages === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const pageNum = parseInt((entry.target as HTMLElement).dataset.page || "1");
                        setCurrentPage(pageNum);
                    }
                });
            },
            { root: containerRef.current, threshold: 0.4 }
        );

        const canvases = containerRef.current.querySelectorAll("[data-page]");
        canvases.forEach((c) => observer.observe(c));

        return () => observer.disconnect();
    }, [numPages, loading]);

    function scrollToPage(pageNum: number) {
        const target = containerRef.current?.querySelector(`[data-page="${pageNum}"]`);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const zoomIn = () => {
        setScale((s) => Math.min(s + 0.25, 3.0));
        renderedAtScale.current = {};
    };
    const zoomOut = () => {
        setScale((s) => Math.max(s - 0.25, 0.5));
        renderedAtScale.current = {};
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-[#f8f9fa] border border-[#cfd8dc] rounded">
                <div className="w-10 h-10 border-4 border-[#007398] border-t-transparent rounded-full animate-spin" />
                <p className="text-[14px] text-[#4d4d4d] font-medium">Loading PDF…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 bg-[#f8f9fa] border border-[#cfd8dc] rounded p-8 text-center">
                <p className="text-[15px] font-semibold text-[#4d4d4d]">{error}</p>
                <div className="flex gap-3">
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#007398] text-white text-[13px] font-semibold rounded hover:bg-[#005f7c] transition">
                        <ExternalLink size={14} /> Open PDF
                    </a>
                    <a href={pdfUrl} download
                        className="flex items-center gap-2 px-5 py-2.5 border border-[#007398] text-[#007398] text-[13px] font-semibold rounded hover:bg-[#f0f7fa] transition">
                        <Download size={14} /> Download
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-0">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-white rounded-t text-[13px]">
                <div className="flex items-center gap-3">
                    {/* Page navigation */}
                    <button onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className="p-1 hover:bg-white/20 rounded disabled:opacity-30 transition">
                        <ChevronUp size={16} />
                    </button>
                    <span className="font-mono text-[12px] min-w-[80px] text-center">
                        {currentPage} / {numPages}
                    </span>
                    <button onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
                        disabled={currentPage >= numPages}
                        className="p-1 hover:bg-white/20 rounded disabled:opacity-30 transition">
                        <ChevronDown size={16} />
                    </button>
                </div>

                {/* Zoom */}
                <div className="flex items-center gap-2">
                    <button onClick={zoomOut} className="p-1 hover:bg-white/20 rounded transition">
                        <ZoomOut size={16} />
                    </button>
                    <span className="font-mono text-[12px] min-w-[44px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button onClick={zoomIn} className="p-1 hover:bg-white/20 rounded transition">
                        <ZoomIn size={16} />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-white/80 hover:text-white hover:underline transition">
                        <ExternalLink size={13} /> Open
                    </a>
                    <a href={pdfUrl} download
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-white/80 hover:text-white hover:underline transition">
                        <Download size={13} /> Download
                    </a>
                </div>
            </div>

            {/* Canvas pages */}
            <div ref={containerRef}
                className="overflow-y-auto bg-[#525659] rounded-b border border-t-0 border-[#2d2d2d]"
                style={{ maxHeight: "85vh" }}>
                <div className="flex flex-col items-center gap-4 py-6 px-4">
                    {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                        <div key={pageNum} data-page={pageNum}
                            className="shadow-xl bg-white">
                            <canvas
                                ref={(el) => { canvasRefs.current[pageNum - 1] = el; }}
                                className="block max-w-full"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
