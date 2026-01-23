import { test, expect } from '@playwright/test';

test.describe('Public Access Flows', () => {

    test('Homepage loads and displays journals', async ({ page }) => {
        await page.goto('/');

        // Check Hero - using Regex for flexibility
        await expect(page.getByRole('heading', { name: /Welcome to IJAISM/i })).toBeVisible();

        // Check Stats
        await expect(page.getByRole('heading', { name: 'Academic Journals', level: 2 })).toBeVisible();

        // Check Journal Listing
        await expect(page.getByText('JITMB', { exact: false }).first()).toBeVisible();
    });

    test('Articles page lists published items', async ({ page }) => {
        await page.goto('/articles');

        // Check article card
        await expect(page.getByRole('heading', { name: 'Published AI Research' })).toBeVisible();
        await expect(page.getByText('JITMB')).toBeVisible();
    });

    test('Article Details page displays content', async ({ page }) => {
        // Navigate via click
        await page.goto('/articles');
        await page.getByText('Read More').first().click();

        // Verify Title and Abstract
        await expect(page.getByRole('heading', { name: 'Published AI Research', level: 1 })).toBeVisible();
        await expect(page.getByText('This is a published article about AI')).toBeVisible();

        // Verify Author Display
        await expect(page.getByText('Test Author', { exact: false })).toBeVisible();
        await expect(page.getByText('E2E University', { exact: false })).toBeVisible();
    });

    test('Search functionality filters articles', async ({ page }) => {
        // Checking direct filter URL support
        await page.goto('/articles?journal=JITMB');
        await expect(page.getByRole('heading', { name: 'Published AI Research' })).toBeVisible();

        await page.goto('/articles?journal=INVALID');
        await expect(page.getByRole('heading', { name: 'Published AI Research' })).not.toBeVisible();
    });
});
