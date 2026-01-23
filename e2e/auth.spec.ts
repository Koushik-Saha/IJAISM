import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
    test.beforeEach(async ({ page }) => {
        // Clear any previous session
        await page.context().clearCookies();
    });

    test('User can register with valid academic email', async ({ page }) => {
        const uniqueSuffix = Date.now();
        const email = `newuser${uniqueSuffix}@university.edu`;

        await page.goto('/register');
        await page.getByPlaceholder('Full Name').fill('New User');
        await page.getByPlaceholder('name@university.edu').fill(email);
        await page.getByPlaceholder('University/Affiliation').fill('Test Uni');
        await page.getByPlaceholder('Password').fill('password123');

        await page.getByRole('button', { name: 'Create Account' }).click();

        // Expect success message or redirection
        await expect(page.getByText('Registration successful')).toBeVisible();
    });

    test('Login with valid credentials redirects to dashboard', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('name@university.edu').fill('author@c5k.com');
        await page.getByPlaceholder('Password').fill('password123');
        await page.getByRole('button', { name: 'Sign in' }).click();

        await expect(page).toHaveURL('/dashboard');
        await expect(page.getByText('Welcome, Test Author')).toBeVisible();
    });

    test('Login with invalid password shows error', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('name@university.edu').fill('author@c5k.com');
        await page.getByPlaceholder('Password').fill('wrongpass');
        await page.getByRole('button', { name: 'Sign in' }).click();

        await expect(page.getByText('Invalid email or password')).toBeVisible();
    });
});
