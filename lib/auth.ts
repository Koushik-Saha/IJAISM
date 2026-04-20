import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined. Authentication cannot proceed.');
}

// Role Definitions
export const ROLES = {
  MOTHER_ADMIN: 'mother_admin', // Superior Admin (Root)
  SUPER_ADMIN: 'super_admin',
  EDITOR: 'editor',
  SUB_EDITOR: 'sub_editor',
  REVIEWER: 'reviewer',
  AUTHOR: 'author'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export interface TokenPayload {
  userId: string;
  email: string;
  role: string; // Should be UserRole, but keeping string for loose compatibility
  forcePasswordChange?: boolean;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '7d',
    algorithm: 'HS256'
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    }) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Deprecated: logic changed to allow any valid email
export function isAcademicEmail(email: string): boolean {
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
