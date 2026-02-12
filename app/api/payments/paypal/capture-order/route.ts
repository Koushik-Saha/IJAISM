
import { NextRequest, NextResponse } from 'next/server';
import paypal from '@paypal/checkout-server-sdk';
import client from '@/lib/paypal';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendPaymentSuccessEmail } from '@/lib/email/send';

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
        const userEmail = decoded.email;

        // 2. Parse Request
        const { orderID } = await req.json();
        if (!orderID) {
            return NextResponse.json({ error: 'Missing Order ID' }, { status: 400 });
        }

        // 3. Capture Order
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({}); // Empty body as per SDK for generic capture

        // Execute request
        const response = await client().execute(request);
        const result = response.result;

        if (result.status !== 'COMPLETED') {
            return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
        }

        // 4. Extract Metadata (Custom ID) from the purchase unit
        // We saved this as `BOOK_{id}_USER_{id}` or `APC_{id}_USER_{id}`
        const purchaseUnit = result.purchase_units[0];
        const customId = purchaseUnit.custom_id || purchaseUnit.reference_id; // Try both

        if (!customId) {
            console.error('Missing custom_id in payment result', result);
            return NextResponse.json({ error: 'Payment Metadata Missing' }, { status: 500 });
        }

        // 5. Fulfill Order based on Custom ID
        if (customId.startsWith('BOOK_')) {
            // Format: BOOK_{bookId}_USER_{userId}
            // Note: userId is also in the token, we can cross-verify if needed, but token userId is safer.
            const parts = customId.split('_');
            const bookId = parts[1]; // Index 1 is the ID

            await prisma.purchasedBook.create({
                data: {
                    userId,
                    bookId,
                    price: purchaseUnit.payments.captures[0].amount.value,
                    paypalOrderId: orderID
                }
            });

            // Send Email (Async)
            sendPaymentSuccessEmail(userEmail, "Book Purchase", purchaseUnit.description, purchaseUnit.payments.captures[0].amount.value).catch(console.error);

        } else if (customId.startsWith('APC_')) {
            // Format: APC_{articleId}_USER_{userId}
            const parts = customId.split('_');
            const articleId = parts[1];

            await prisma.article.update({
                where: { id: articleId },
                data: {
                    isApcPaid: true,
                    apcAmount: parseFloat(purchaseUnit.payments.captures[0].amount.value),
                    paypalOrderId: orderID
                }
            });

            // Send Email (Async)
            sendPaymentSuccessEmail(userEmail, "Article Processing Charge", purchaseUnit.description, purchaseUnit.payments.captures[0].amount.value).catch(console.error);
        } else {
            console.warn('Unknown Custom ID format during capture:', customId);
            // We captured the money but don't know what to do. 
            // In prod, this should alert admin.
        }

        return NextResponse.json({ success: true, status: 'COMPLETED' });

    } catch (error: any) {
        console.error('PayPal Capture Error:', error);
        // If it's an API error, it might contain details
        const message = error.message || 'Payment capture failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
