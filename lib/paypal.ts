
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

const configureEnvironment = function () {
    const clientId = process.env.PAYPAL_CLIENT_ID || 'PAYPAL_CLIENT_ID_NOT_SET';
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'PAYPAL_CLIENT_SECRET_NOT_SET';

    // Choose environment based on NODE_ENV
    // For production, use LiveEnvironment
    // For development/test, use SandboxEnvironment
    if (process.env.NODE_ENV === 'production') {
        return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
    } else {
        // Default to Sandbox
        return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
    }
};

const client = function () {
    return new checkoutNodeJssdk.core.PayPalHttpClient(configureEnvironment());
};

export default client;
