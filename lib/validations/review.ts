import { z } from 'zod';

export const reviewDecisionSchema = z.object({
    decision: z.enum(['accept', 'reject', 'revision_requested']),
    commentsToAuthor: z.string().min(50, 'Comments to author must be at least 50 characters'),
    commentsToEditor: z.string().optional(),
});

export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;
