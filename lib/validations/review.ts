import { z } from 'zod';

export const reviewDecisionSchema = z.object({
    decision: z.enum(['accept', 'reject', 'minor_revision', 'major_revision', 'no_recommendation']),
    commentsToAuthor: z.string(),
    commentsToEditor: z.string().optional(),
    reviewerFiles: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
    if (data.decision === 'minor_revision' || data.decision === 'major_revision') {
        if (data.commentsToAuthor.trim().length < 50) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Comments to author must be at least 50 characters for revision requests',
                path: ['commentsToAuthor'],
            });
        }
        if (!data.commentsToEditor || data.commentsToEditor.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Comments to editor are required for revision requests',
                path: ['commentsToEditor'],
            });
        }
    }
});

export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;
