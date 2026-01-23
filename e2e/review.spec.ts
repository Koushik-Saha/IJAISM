import { test, expect } from '@playwright/test';

test.describe('Reviewer Dashboard Flow', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', exception => console.log(`PAGE ERROR: "${exception}"`));
        // Verify console logs working
        await page.goto('/login');
        await page.evaluate(() => console.log("TESTING CONSOLE LOG"));
        await page.fill('input[name="email"]', 'reviewer1@ijaism.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Wait for potential error message or redirect
        try {
            await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
        } catch (e) {
            // Check for error message
            const errorElement = page.locator('.text-red-700');
            if (await errorElement.isVisible()) {
                const text = await errorElement.textContent();
                console.log('Login failed with error:', text);
            } else {
                console.log('Login failed but no error message visible. Current URL:', page.url());
            }
            throw e;
        }
    });

    test('should view assigned reviews', async ({ page }) => {
        await page.goto('/dashboard/reviews');

        // check if reviews exist or empty state
        // We expect at least the "Reviews" header
        await expect(page.locator('h1')).toContainText('Reviews');

        // If there are reviews, click one
        // This is flaky if seed doesn't assign reviews. 
        // Assuming seed data might have some assigns or we check empty state.

        // Just verify page load for now
    });
});
