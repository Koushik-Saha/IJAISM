
declare module '@paypal/checkout-server-sdk' {
    export namespace core {
        class LiveEnvironment {
            constructor(clientId: string, clientSecret: string);
        }
        class SandboxEnvironment {
            constructor(clientId: string, clientSecret: string);
        }
        class PayPalHttpClient {
            constructor(environment: LiveEnvironment | SandboxEnvironment);
            execute(request: any): Promise<any>;
        }
    }
    export namespace orders {
        class OrdersCreateRequest {
            prefer(value: string): void;
            requestBody(body: any): void;
        }
        class OrdersCaptureRequest {
            constructor(orderId: string);
            requestBody(body: any): void;
        }
    }
}
