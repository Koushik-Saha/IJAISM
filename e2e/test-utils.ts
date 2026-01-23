import { expect, type Page } from '@playwright/test';

export async function loginAs(page: Page, email: string, role: 'author' | 'reviewer' | 'editor' = 'author') {
    await page.goto('/login');
    await page.getByPlaceholder('name@university.edu').fill(email);
    await page.getByPlaceholder('Password').fill('password123'); // Default from seed
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/dashboard');
    // Optional: Verify role-specific dashboard elements if needed
}

export async function uploadFile(page: Page, selector: string, fileName: string) {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator(selector).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
        name: fileName,
        mimeType: 'application/pdf',
        buffer: Buffer.from('dummy pdf content')
    });
}
