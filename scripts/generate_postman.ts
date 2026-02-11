
import fs from 'fs';
import path from 'path';

const API_ROOT = path.join(process.cwd(), 'app/api');
const OUTPUT_FILE = path.join(process.cwd(), 'c5k_platform_complete_api.postman_collection.json');

interface PostmanItem {
    name: string;
    item?: PostmanItem[];
    request?: any;
    event?: any[];
}

function getMethodsFromRouteFile(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const methods = [];
    if (content.match(/export\s+(async\s+)?function\s+GET/)) methods.push('GET');
    if (content.match(/export\s+(async\s+)?function\s+POST/)) methods.push('POST');
    if (content.match(/export\s+(async\s+)?function\s+PUT/)) methods.push('PUT');
    if (content.match(/export\s+(async\s+)?function\s+DELETE/)) methods.push('DELETE');
    if (content.match(/export\s+(async\s+)?function\s+PATCH/)) methods.push('PATCH');
    return methods;
}

function scanDirectory(dir: string, items: PostmanItem[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            const folderItem: PostmanItem = {
                name: entry.name,
                item: []
            };
            scanDirectory(fullPath, folderItem.item!);
            // Only add folder if it has children (routes or subfolders with routes)
            if (folderItem.item!.length > 0) {
                items.push(folderItem);
            }
        } else if (entry.name === 'route.ts') {
            // This is an API route
            const methods = getMethodsFromRouteFile(fullPath);
            const relativePath = path.relative(API_ROOT, dir); // e.g., "auth/login"
            const urlPath = relativePath.split(path.sep).join('/');

            // Handle dynamic routes [id] -> :id
            const formattedUrlPath = urlPath.replace(/\[([^\]]+)\]/g, ':$1');
            const urlParts = formattedUrlPath.split('/');

            methods.forEach(method => {
                const isLogin = urlPath === 'auth/login' && method === 'POST';

                const requestItem: PostmanItem = {
                    name: `${method} ${formattedUrlPath}`, // e.g., "POST auth/login"
                    request: {
                        method: method,
                        header: [],
                        url: {
                            raw: `{{baseUrl}}/api/${formattedUrlPath}`,
                            host: ["{{baseUrl}}"],
                            path: ["api", ...urlParts],
                            variable: [] // Could populate variables for :id here if needed
                        }
                    }
                };

                // Add body template for POST/PUT/PATCH
                if (['POST', 'PUT', 'PATCH'].includes(method)) {
                    requestItem.request.body = {
                        mode: "raw",
                        raw: "{\n  \n}",
                        options: { raw: { language: "json" } }
                    };
                }

                // Special handling for Login - Add the test script
                if (isLogin) {
                    requestItem.event = [{
                        listen: "test",
                        script: {
                            exec: [
                                "var jsonData = pm.response.json();",
                                "if (jsonData.success && jsonData.data && jsonData.data.accessToken) {",
                                "    pm.collectionVariables.set(\"token\", jsonData.data.accessToken);",
                                "    console.log(\"Token stored automatically\");",
                                "}"
                            ],
                            type: "text/javascript"
                        }
                    }];
                }

                items.push(requestItem);
            });
        }
    }
}

function main() {
    console.log("Scanning API routes...");
    const rootItems: PostmanItem[] = [];
    scanDirectory(API_ROOT, rootItems);

    const collection = {
        info: {
            name: "C5K Platform Complete API",
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        variable: [
            { key: "baseUrl", value: "http://localhost:3000", type: "string" },
            { key: "token", value: "", type: "string" }
        ],
        auth: {
            type: "bearer",
            bearer: [{ key: "token", value: "{{token}}", type: "string" }]
        },
        item: rootItems
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(collection, null, 2));
    console.log(`Generated collection at ${OUTPUT_FILE} with ${rootItems.length} top-level items (recursive).`);
}

main();
