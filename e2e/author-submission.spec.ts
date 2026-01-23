import { test, expect } from '@playwright/test';
import { loginAs, uploadFile } from './test-utils';

test.describe('Author Submission Flow', () => {

    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'author@c5k.com');
    });

    test('Author can submit a new manuscript', async ({ page }) => {
        // Navigate to Submission
        await page.goto('/dashboard/submit');

        // Fill Form
        await page.getByLabel('Title').fill('E2E Test Manuscript Title');
        await page.getByLabel('Abstract').fill('This is a 150 word abstract '.repeat(15)); // Valid length

        // Select Journal (assuming dropdown or search)
        // If Select/Combobox
        await page.getByRole('combobox', { name: 'Select Journal' }).click();
        await page.getByText('JITMB').click();

        // Keywords
        await page.getByLabel('Keywords').fill('Test, Playwright, E2E, Automation');

        // File Upload
        await uploadFile(page, 'input[type="file"]', 'manuscript.pdf');

        // Submit
        await page.getByRole('button', { name: 'Submit Manuscript' }).click();

        // Verification
        await expect(page.getByText('Article submitted successfully')).toBeVisible();
        await expect(page).toHaveURL(/\/dashboard\/submissions\/.+/);
    });
});
