import { hashPassword, comparePassword, isAcademicEmail, generateToken, verifyToken } from '@/lib/auth';

describe('Auth Utilities', () => {
    describe('Password Hashing', () => {
        it('should hash a password successfully', async () => {
            const password = 'mySecretPassword123';
            const hash = await hashPassword(password);
            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);
        });

        it('should verify a correct password', async () => {
            const password = 'mySecretPassword123';
            const hash = await hashPassword(password);
            const isValid = await comparePassword(password, hash);
            expect(isValid).toBe(true);
        });

        it('should reject an incorrect password', async () => {
            const password = 'mySecretPassword123';
            const hash = await hashPassword(password);
            const isValid = await comparePassword('wrongPassword', hash);
            expect(isValid).toBe(false);
        });
    });

    describe('Academic Email Validation', () => {
        it('should accept .edu emails', () => {
            expect(isAcademicEmail('student@university.edu')).toBe(true);
        });

        it('should accept .ac.uk emails', () => {
            expect(isAcademicEmail('professor@cambridge.ac.uk')).toBe(true);
        });

        it('should accept known academic domains like .org if allowed (check implementation)', () => {
            // Assuming implementation allows .org or specific lists for now based on standard academic regex
            // If current impl is simple regex, test constraints:
            // Adjust these expectations based on the actual Lib
            expect(isAcademicEmail('researcher@institute.org')).toBe(true);
        });

        it('should reject generic domains', () => {
            expect(isAcademicEmail('user@gmail.com')).toBe(false);
            expect(isAcademicEmail('user@yahoo.com')).toBe(false);
            expect(isAcademicEmail('user@hotmail.com')).toBe(false);
        });
    });

    describe('JWT Token Generation', () => {
        it('should generate a valid token', () => {
            const payload = { userId: '123', email: 'test@edu.com', role: 'author' };
            const token = generateToken(payload);
            expect(typeof token).toBe('string');
            expect(token.split('.').length).toBe(3); // Header.Payload.Signature
        });

        it('should verify and decode a token correctly', () => {
            const payload = { userId: '456', email: 'verifier@edu.com', role: 'reviewer' };
            const token = generateToken(payload);
            const decoded = verifyToken(token);

            expect(decoded).toBeDefined();
            expect(decoded?.userId).toBe(payload.userId);
            expect(decoded?.email).toBe(payload.email);
            expect(decoded?.role).toBe(payload.role);
        });

        it('should return null for invalid token', () => {
            const result = verifyToken('invalid.token.string');
            expect(result).toBeNull();
        });
    });
});
