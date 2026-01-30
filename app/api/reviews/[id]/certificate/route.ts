import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: reviewId } = await params;
        const url = new URL(req.url);

        // 1. Verify authentication (Header OR Query Param for window.open)
        let token = req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            token = url.searchParams.get('token') || undefined;
        }

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
        }

        const userId = decoded.userId;

        // 2. Fetch Review Details
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                reviewer: true,
                article: {
                    include: {
                        journal: true
                    }
                }
            }
        });

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // 3. Access Control (Must be the reviewer)
        if (review.reviewerId !== userId) {
            // Allow admins?
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
            if (!user || !['super_admin', 'mother_admin', 'editor'].includes(user.role)) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }
        }

        // 4. Verify Completion
        if (review.status !== 'completed') {
            return NextResponse.json({ error: 'Certificate is only available for completed reviews' }, { status: 400 });
        }

        // 5. Generate PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([842, 595]); // A4 Landscape
        const { width, height } = page.getSize();

        // Embed Fonts
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        const fontScript = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic); // Approximating script/calligraphy

        // Embed Logo
        const fs = require('fs');
        const path = require('path');
        const logoPath = path.join(process.cwd(), 'public', 'logo.png');

        let logoImage;
        if (fs.existsSync(logoPath)) {
            const logoBytes = fs.readFileSync(logoPath);
            logoImage = await pdfDoc.embedPng(logoBytes);
        }

        // Helper: Draw Centered Text
        const drawCenteredText = (text: string, y: number, size: number, fontToUse = fontRegular, color = rgb(0.2, 0.2, 0.2)) => {
            const textWidth = fontToUse.widthOfTextAtSize(text, size);
            page.drawText(text, {
                x: (width - textWidth) / 2,
                y,
                size,
                font: fontToUse,
                color,
            });
        };

        // --- DRAWING ---

        // 1. Logo (Top Left)
        if (logoImage) {
            const logoDims = logoImage.scale(0.5); // Adjust scale as needed
            page.drawImage(logoImage, {
                x: 50,
                y: height - 150,
                width: logoDims.width,
                height: logoDims.height,
            });
        }

        // 2. Header
        // "CERTIFICATE"
        drawCenteredText('CERTIFICATE', height - 100, 42, fontRegular, rgb(0.0, 0.35, 0.45)); // Teal/Dark Blue

        // "OF REVIEWING"
        drawCenteredText('OF REVIEWING', height - 140, 28, fontRegular, rgb(0.6, 0.6, 0.6)); // Light Gray

        // Separator Line
        page.drawLine({
            start: { x: 200, y: height - 160 },
            end: { x: width - 200, y: height - 160 },
            thickness: 1,
            color: rgb(0.7, 0.7, 0.7),
        });

        // 3. Journal Name (Uppercase)
        const journalName = review.article.journal.fullName.toUpperCase();
        drawCenteredText(journalName, height - 200, 20, fontRegular, rgb(0.5, 0.5, 0.5));

        // 4. Awarded Date Line
        // Use submittedAt as the completion date
        const completionDate = review.submittedAt || review.updatedAt || new Date();
        const dateStr = completionDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

        // "AWARDED [DATE] TO"
        drawCenteredText(`AWARDED ${dateStr} TO`, height - 260, 16, fontBold, rgb(0.0, 0.0, 0.0));

        // 5. Reviewer Name (Large, Script-like, Red)
        // Using TimesBoldItalic to approximate the fancy look
        drawCenteredText(review.reviewer.name, height - 340, 60, fontScript, rgb(0.8, 0.1, 0.1)); // Red

        // 6. Body Paragraph
        const bodyText = `In recognition of valuable and dedicated contribution in reviewing scholarly manuscripts for ${review.article.journal.fullName}. Your expertise, insightful feedback, and commitment to academic excellence have greatly contributed to maintaining the high quality of our publications.`;

        // Simple text wrapping (approximate)
        const maxLineWidth = 600;
        const words = bodyText.split(' ');
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = fontBold.widthOfTextAtSize(`${currentLine} ${word}`, 12); // Using bold font for calc to be safe
            if (width < maxLineWidth) {
                currentLine += ` ${word}`;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        let currentY = 120;
        lines.forEach((line) => {
            drawCenteredText(line, currentY, 12, fontSerifBold, rgb(0.6, 0.6, 0.6));
            currentY -= 18;
        });

        const pdfBytes = await pdfDoc.save();

        // 6. Return PDF
        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `attachment; filename="Certificate-${reviewId}.pdf"`);

        return new NextResponse(Buffer.from(pdfBytes), { headers });

    } catch (error: any) {
        console.error('Certificate Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
    }
}
