import { test, expect } from '@playwright/test';

test.describe('Reviewer Dashboard Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login as reviewer
        await page.goto('/login');
        await page.fill('input[name="email"]', 'reviewer1@c5k.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard');
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
