
/**
 * Virus Scanning Service (Mock)
 * 
 * In a production environment, this would integrate with ClamAV or a cloud scanning service.
 * For this implementation, we simulate scanning based on file metadata.
 */

import { logger } from '@/lib/logger';

interface ScanResult {
    safe: boolean;
    reason?: string;
}

export async function scanFile(file: File): Promise<ScanResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    const fileName = file.name.toLowerCase();

    // Mock Detection Logic:
    // Reject files explicitly named to test virus detection
    if (fileName.includes('eicar') || fileName.includes('virus') || fileName.includes('malware')) {
        logger.warn('Virus detected in uploaded file', { fileName, size: file.size });
        return {
            safe: false,
            reason: 'Security Threat Detected: File identified as malicious (Mock Virus Signature)'
        };
    }

    // Mock executable detection (though generic upload api checks mime type, we double check here)
    if (fileName.endsWith('.exe') || fileName.endsWith('.sh') || fileName.endsWith('.bat')) {
        return {
            safe: false,
            reason: 'Security Risk: Executable files are not permitted'
        };
    }

    return { safe: true };
}
