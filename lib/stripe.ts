
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // Updated to match latest or remove line if fails. Actually trying to remove explicit version to let it default or match the type error suggestion if I knew it.
    // The error said 2025-12-15.clover. That looks like a future date or internal.
    // I will try to remove the apiVersion line to let the library use its default.
    typescript: true,
});
