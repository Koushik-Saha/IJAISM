import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    university: z.string().min(2, 'University/Affiliation is required'),
});

export const profileUpdateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    university: z.string().min(2, 'University must be at least 2 characters').optional(),
    affiliation: z.string().optional(),
    orcid: z.string().optional(),
    bio: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
