import { test, expect } from '@playwright/test';
import { loginAs } from './test-utils';

test.describe('Reviewer Flows', () => {

    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'reviewer@c5k.com');
    });

    test('Reviewer sees assigned papers', async ({ page }) => {
        await page.goto('/dashboard/reviews');

        // Should have one assigned from seed
        await expect(page.getByText('Submitted Manuscript')).toBeVisible();
        await expect(page.getByText('Pending')).toBeVisible();
    });

    test('Reviewer can submit a review decision', async ({ page }) => {
        await page.goto('/dashboard/reviews');

        // Click to view
        await page.getByText('Submitted Manuscript').click();

        // Start Review (if not started)
        const startBtn = page.getByRole('button', { name: 'Start Review' });
        if (await startBtn.isVisible()) {
            await startBtn.click();
        }

        // Fill Decision Form
        await page.getByLabel('Comments to Author').fill('This is a comprehensive review (must be >50 chars)........................');
        await page.getByLabel('Comments to Editor').fill('Looks fine.');

        // Select Decision (Assuming radio or select)
        await page.getByLabel('Decision').selectOption('accept'); // or click radio

        // Submit
        await page.getByRole('button', { name: 'Submit Review' }).click();

        // Verification
        await expect(page.getByText('Review submitted successfully')).toBeVisible();
    });
});
