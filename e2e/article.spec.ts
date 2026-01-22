import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Article Submission Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login as author
        await page.goto('/login');
        await page.fill('input[name="email"]', 'demo.author@ijaism.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('should submit an article successfully', async ({ page }) => {
        await page.goto('/submit');

        // Fill Form
        await page.fill('input[name="title"]', `E2E Article Title ${Date.now()}`);
        // Select Journal (assuming select or autocomplete)
        // Adjust selector based on UI implementation
        // If it's a select:
        // await page.selectOption('select[name="journal"]', { label: 'International Journal of AI' });
        // If it's a custom Combobox, might need click interactions.
        // Let's assume standard input for now or try to target specific element IDs if known.
        // Based on previous code, journal might be a string input or select. 
        // Just using fill for generic approach, assuming accessible inputs.

        // Wait for form to load
        await expect(page.locator('form')).toBeVisible();

        // Type Title
        // await page.fill('input[name="title"]', ...); // Done above

        // Abstract
        const abstract = 'This is a valid abstract for the E2E test. '.repeat(15);
        await page.fill('textarea[name="abstract"]', abstract);

        // Keywords
        await page.fill('input[name="keywords"]', 'testing, playwright, e2e, automation');

        // Journal Selection (Critical Path - assuming first option or specific ID)
        // Check if there is a journal select
        const journalSelect = page.locator('select[name="journal"]');
        if (await journalSelect.count() > 0) {
            await journalSelect.selectOption({ index: 1 });
        } else {
            // Maybe it's a text input or custom dropdown
            // Try filling text if it's an autocomplete
            await page.fill('input[name="journal"]', 'Journal');
            // Or click first result
            // await page.click('.journal-option');
        }

        // Submit
        await page.click('button[type="submit"]');

        // Verification
        // Should pass if validation passes.
        // Check for success toast or redirect
        await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
    });
});
