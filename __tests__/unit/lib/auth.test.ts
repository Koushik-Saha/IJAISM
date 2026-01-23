import { generateToken, verifyToken, hashPassword, comparePassword, isAcademicEmail } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock external libraries
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('lib/auth', () => {
    const mockPayload = { userId: '123', email: 'test@test.com', role: 'user' };
    const mockToken = 'mock.jwt.token';
    const mockHash = 'hashed_secret';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateToken', () => {
        it('should sign payload and return a token', () => {
            (jwt.sign as jest.Mock).mockReturnValue(mockToken);

            const result = generateToken(mockPayload);

            expect(jwt.sign).toHaveBeenCalledWith(
                mockPayload,
                expect.any(String), // JWT_SECRET
                { expiresIn: '7d' }
            );
            expect(result).toBe(mockToken);
        });
    });

    describe('verifyToken', () => {
        it('should return payload for valid token', () => {
            (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

            const result = verifyToken(mockToken);

            expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
            expect(result).toEqual(mockPayload);
        });

        it('should return null for invalid token', () => {
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const result = verifyToken('bad_token');

            expect(result).toBeNull();
        });
    });

    describe('hashPassword', () => {
        it('should return a hashed string', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

            const result = await hashPassword('secret');

            expect(bcrypt.hash).toHaveBeenCalledWith('secret', 12);
            expect(result).toBe(mockHash);
        });
    });

    describe('comparePassword', () => {
        it('should return true for matching password', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await comparePassword('secret', mockHash);

            expect(bcrypt.compare).toHaveBeenCalledWith('secret', mockHash);
            expect(result).toBe(true);
        });

        it('should return false for mismatching password', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await comparePassword('wrong', mockHash);

            expect(result).toBe(false);
        });
    });

    describe('isAcademicEmail', () => {
        it('should validate correct email format', () => {
            expect(isAcademicEmail('test@university.edu')).toBe(true);
            expect(isAcademicEmail('user@gmail.com')).toBe(true);
        });

        it('should reject invalid email format', () => {
            expect(isAcademicEmail('invalid-email')).toBe(false);
            expect(isAcademicEmail('user@')).toBe(false);
            expect(isAcademicEmail('@domain.com')).toBe(false);
        });
    });
});
