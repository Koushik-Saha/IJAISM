
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: reviewId } = await params;

        // Auth Check
        const url = new URL(request.url);
        let token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) token = url.searchParams.get('token') || undefined;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
        }

        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                article: true,
                reviewer: true
            }
        });

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        // Access Control: Reviewer themselves or Editor/Admin
        const isOwner = review.reviewerId === decoded.userId;
        const isAdmin = ['editor', 'super_admin', 'mother_admin'].includes(decoded.role);

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        if (review.status !== 'completed') {
            return NextResponse.json({ error: "Review not completed yet" }, { status: 400 });
        }

        // Generate PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([842, 595]); // A4 Landscape
        const { width, height } = page.getSize();

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

        // Border
        page.drawRectangle({
            x: 20,
            y: 20,
            width: width - 40,
            height: height - 40,
            borderColor: rgb(0, 0, 0.5),
            borderWidth: 4,
        });

        const drawCentered = (text: string, y: number, size: number, fontToUse: any, color = rgb(0, 0, 0)) => {
            const textWidth = fontToUse.widthOfTextAtSize(text, size);
            page.drawText(text, {
                x: (width - textWidth) / 2,
                y,
                size,
                font: fontToUse,
                color,
            });
        };

        // Header
        drawCentered('CERTIFICATE OF REVIEWING', height - 120, 36, fontBold, rgb(0, 0, 0.5));

        drawCentered('This certificate is awarded to', height - 180, 18, font);

        // Reviewer Name
        drawCentered(review.reviewer.name.toUpperCase(), height - 230, 30, fontBold, rgb(0, 0, 0));

        drawCentered('in recognition of the review contributed to the journal', height - 280, 18, font);

        // Journal Name
        drawCentered('International Journal of AI & SM (C5K)', height - 320, 24, fontBold, rgb(0.2, 0.2, 0.2));

        drawCentered('for the manuscript titled:', height - 370, 14, fontItalic);

        // Article Title (Truncate if too long logic could be added, but simple centered for now)
        // Split into lines if needed. primitive wrap for now.
        const title = review.article.title;
        if (title.length > 80) {
            drawCentered(title.substring(0, 80) + '...', height - 400, 16, fontBold);
        } else {
            drawCentered(title, height - 400, 16, fontBold);
        }

        // Date
        // Use submittedAt as the official date
        const dateStr = review.submittedAt ? new Date(review.submittedAt).toLocaleDateString() : new Date().toLocaleDateString();
        // review.date doesn't exist on schema directly usually? review.updatedAt or implicit?
        // Schema shows `submittedAt`.
        const completionDate = review.submittedAt
            ? new Date(review.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : new Date().toLocaleDateString();

        drawCentered(`Presented on: ${completionDate}`, 100, 14, font);

        // Signatures (Mock)
        page.drawText('Editor-in-Chief', { x: 150, y: 60, size: 12, font: fontBold });
        page.drawLine({ start: { x: 130, y: 80 }, end: { x: 250, y: 80 }, thickness: 1, color: rgb(0, 0, 0) });

        page.drawText('C5K Editorial Office', { x: 550, y: 60, size: 12, font: fontBold });
        page.drawLine({ start: { x: 530, y: 80 }, end: { x: 700, y: 80 }, thickness: 1, color: rgb(0, 0, 0) });


        const pdfBytes = await pdfDoc.save();

        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Certificate-${review.reviewerNumber}.pdf"`
            }
        });

    } catch (error: any) {
        console.error("Certificate Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
