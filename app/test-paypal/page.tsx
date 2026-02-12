'use client';

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState, useEffect } from 'react';

export default function TestPaypalPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [paypalGlobal, setPaypalGlobal] = useState(false);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    };

    useEffect(() => {
        // Override console.error to capture logs
        const originalError = console.error;
        console.error = (...args) => {
            addLog(`ERROR: ${args.join(' ')}`);
            originalError.apply(console, args);
        };

        const originalLog = console.log;
        console.log = (...args) => {
            addLog(`LOG: ${args.join(' ')}`);
            originalLog.apply(console, args);
        };

        // Check for script tag
        const interval = setInterval(() => {
            const scripts = Array.from(document.getElementsByTagName('script'));
            const paypalScript = scripts.find(s => s.src.includes('paypal.com/sdk'));
            if (paypalScript) {
                setScriptLoaded(true);
                addLog(`SCRIPT FOUND: ${paypalScript.src.substring(0, 50)}...`);
            }

            // @ts-ignore
            if (window.paypal) {
                setPaypalGlobal(true);
                // @ts-ignore
                addLog(`WINDOW.PAYPAL: Version ${window.paypal.version}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const clientId = "AZOcrumfPpUuRElUqvh92PG0dwyqkXvUTyTWniy9lzRUAIxSYduKe5mxmpvcN1DynetRHe7HKayLB7Ve";

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>PayPal Advanced Debugger</h1>

            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                    <h3>Status</h3>
                    <p>Script Injected: {scriptLoaded ? '✅ YES' : '❌ NO'}</p>
                    <p>window.paypal: {paypalGlobal ? '✅ YES' : '❌ NO'}</p>

                    <h3>Buttons Area</h3>
                    <div style={{ width: '100%', border: '2px dashed red', padding: '10px', minHeight: '150px' }}>
                        <PayPalScriptProvider
                            options={{
                                clientId: clientId,
                                components: "buttons",
                                debug: true,
                                // @ts-ignore
                                "data-sdk-integration-source": "developer-studio"
                            }}
                        >
                            <PayPalButtons
                                style={{ layout: "vertical" }}
                                onInit={() => addLog("PayPalButtons.onInit called")}
                                createOrder={(data, actions) => {
                                    addLog("createOrder called");
                                    return actions.order.create({
                                        purchase_units: [{ amount: { value: "1.00" } }],
                                        intent: "CAPTURE"
                                    });
                                }}
                                onError={(err) => addLog(`PayPalButtons.onError: ${JSON.stringify(err)}`)}
                            />
                        </PayPalScriptProvider>
                    </div>
                </div>

                <div style={{ flex: 1, background: '#f0f0f0', padding: '10px', height: '80vh', overflow: 'auto' }}>
                    <h3>Process Logs</h3>
                    {logs.map((L, i) => (
                        <div key={i} style={{ borderBottom: '1px solid #ddd', padding: '2px 0' }}>{L}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}
