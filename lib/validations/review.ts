import { z } from 'zod';

export const reviewDecisionSchema = z.object({
    decision: z.enum(['accept', 'reject', 'revision_requested']),
    commentsToAuthor: z.string(),
    commentsToEditor: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.decision === 'revision_requested') {
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
