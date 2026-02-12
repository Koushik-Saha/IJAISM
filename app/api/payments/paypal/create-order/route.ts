
import { NextRequest, NextResponse } from 'next/server';
import paypal from '@paypal/checkout-server-sdk';
import client from '@/lib/paypal';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Authentication
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }
        const userId = decoded.userId;

        // 2. Parse Request
        // Expected Payload: { type: 'book' | 'apc', itemId: string }
        const { type, itemId } = await req.json();

        if (!['book', 'apc'].includes(type) || !itemId) {
            return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
        }

        let amount = "0.00";
        let description = "";
        let customId = ""; // Used to track what this payment is for

        // 3. Determine Price and Description based on Type
        if (type === 'book') {
            const book = await prisma.book.findUnique({ where: { id: itemId } });
            if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

            // Check if already purchased
            const existingPurchase = await prisma.purchasedBook.findUnique({
                where: { userId_bookId: { userId, bookId: itemId } }
            });
            if (existingPurchase) return NextResponse.json({ error: 'Already purchased' }, { status: 409 });

            amount = book.price; // Assuming price is stored as string "29.99"
            description = `Purchase: ${book.title}`;
            customId = `BOOK_${itemId}_USER_${userId}`;

        } else if (type === 'apc') {
            const article = await prisma.article.findUnique({
                where: { id: itemId },
                include: { journal: true }
            });
            if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
            if (article.isApcPaid) return NextResponse.json({ error: 'APC already paid' }, { status: 409 });
            if (!article.journal.articleProcessingCharge) return NextResponse.json({ error: 'No APC defined for this journal' }, { status: 400 });

            amount = article.journal.articleProcessingCharge.toString();
            description = `APC for Article: ${article.title}`;
            customId = `APC_${itemId}_USER_${userId}`;
        }

        // 4. Create PayPal Order Request
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: customId,
                description: description,
                amount: {
                    currency_code: 'USD',
                    value: amount
                },
                custom_id: customId // Store metadata here
            }]
        });

        // 5. Execute Request
        const response = await client().execute(request);

        // 6. Return Order ID to Frontend
        return NextResponse.json({
            id: response.result.id,
            status: response.result.status
        });

    } catch (error: any) {
        console.error('PayPal Create Order Error:', error);
        return NextResponse.json({ error: error.message || 'Payment creation failed' }, { status: 500 });
    }
}
