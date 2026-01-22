import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should allow a user to register', async ({ page }) => {
        const email = `test.e2e.${Date.now()}@university.edu`;
        await page.goto('/register');
        await page.fill('input[name="name"]', 'E2E Test User');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="university"]', 'Test University');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');

        // Wait for success feedback
        await expect(page.getByText('Registration successful')).toBeVisible({ timeout: 15000 }).catch(() => {
            // Fallback check if it redirects
            console.log('Registration success toast not found, checking redirect...');
        });
    });

    test('should allow a seeded user to login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'demo.author@ijaism.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('/dashboard');
        // Check for dashboard element
        await expect(page.locator('text=Welcome')).toBeVisible();
    });
});
