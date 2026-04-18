import { z } from 'zod';

export const blogSubmissionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title is too long'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  excerpt: z.string().max(300, 'Excerpt is too long').optional().nullable(),
  featuredImageUrl: z.string().optional().nullable(),
  category: z.string().min(1, 'Category is required').optional().nullable(),
  slug: z.string().optional(), // Can be auto-generated if not provided
});

export type BlogSubmissionInput = z.infer<typeof blogSubmissionSchema>;

export const blogReviewSchema = z.object({
  decision: z.enum(['accept', 'revise', 'reject']),
  commentsToAdmin: z.string().optional().nullable(),
  commentsToAuthor: z.string().min(10, 'Comments to author are required'),
});

export type BlogReviewInput = z.infer<typeof blogReviewSchema>;
