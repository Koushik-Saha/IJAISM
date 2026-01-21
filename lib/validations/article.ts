import { z } from 'zod';

export const articleSubmissionSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    journal: z.string().min(1, 'Journal is required'),
    abstract: z.string()
        .min(10, 'Abstract is required')
        .refine((val) => {
            const wordCount = val.trim().split(/\s+/).filter(Boolean).length;
            return wordCount >= 150 && wordCount <= 300;
        }, {
            message: 'Abstract must be between 150 and 300 words',
        }),
    keywords: z.union([
        z.string().transform((val) => val.split(',').map((k) => k.trim()).filter(Boolean)),
        z.array(z.string()),
    ]).refine((val) => val.length >= 4 && val.length <= 7, {
        message: 'Must provide between 4 and 7 keywords',
    }),
    submissionType: z.enum(['research', 'review', 'case_study']).optional(),
    manuscriptUrl: z.string().url('Invalid manuscript URL').optional().nullable(),
    coverLetterUrl: z.string().url('Invalid cover letter URL').optional().nullable(),
});

export type ArticleSubmissionInput = z.infer<typeof articleSubmissionSchema>;
