
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { bookId } = await req.json();

        const book = await prisma.book.findUnique({
            where: { id: bookId },
        });

        if (!book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        // Parse price (e.g., "$29.99" -> 2999)
        const priceString = book.price.replace(/[^0-9.]/g, '');
        const amount = parseFloat(priceString);

        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Invalid book price' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: book.title,
                            description: `By ${book.authors.join(', ')}`,
                            images: book.coverImageUrl ? [book.coverImageUrl] : [],
                        },
                        unit_amount: Math.round(amount * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/books/${book.id}?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/books/${book.id}?canceled=true`,
            customer_email: decoded.email,
            metadata: {
                userId: decoded.userId,
                bookId: book.id,
                type: 'book_purchase'
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Book Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
