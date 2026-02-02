
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret-key-change-me';

/**
 * Generates a signed access token for a specific file path.
 * The token is short-lived to prevent unauthorized sharing.
 */
export function generateSignedFileToken(filePath: string, expiresInSeconds: number = 3600): string {
    return jwt.sign({ file: filePath }, SECRET_KEY, { expiresIn: expiresInSeconds });
}

/**
 * Verifies the token and returns the file path if valid.
 */
export function verifyFileToken(token: string): string | null {
    try {
        const decoded = jwt.verify(token, SECRET_KEY) as { file: string };
        return decoded.file;
    } catch (error) {
        return null; // Invalid or expired
    }
}
