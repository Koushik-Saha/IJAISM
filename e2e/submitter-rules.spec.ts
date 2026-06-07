import { test, expect } from '@playwright/test';
import { loginAs, uploadFile } from './test-utils';

test.describe('Submitter Author & Tab Rules', () => {

    test('Regular user submitting without adding themselves is automatically appended as last author', async ({ page }) => {
        await loginAs(page, 'author@c5k.com');

        // Go to submission page
        await page.goto('/submit');

        // Title and abstract
        await page.locator('input[placeholder="Enter manuscript title"]').fill('A Study on Submitter Auto Append Rules');
        await page.locator('textarea[placeholder="Enter your abstract (150-300 words)"]').fill(
            'This abstract is between 150 and 300 words. Let\'s make it long enough. The submitter author@c5k.com should be appended automatically to the list if they are not in the list explicitly. We are testing this behaviour in this test case. It should place the author at the very end of the list. If they do not add any other co-author, they will be the sole author. If they add other co-authors, they will be placed at the very end of the co-authors sequence list. This ensures regular submitters are always marked as authors of their papers. Testing regular user submit flow for c5k publishing system. We need to add more words to meet the minimum abstract length validation of 150 words. Therefore, we write more descriptions about the submitter auto assignment rule. The rule states that super admins and mother admins are never automatically assigned as authors when they submit a paper. However, all other users are automatically assigned. This is validated.'
        );

        // Select Journal
        await page.locator('select').first().selectOption({ label: 'JITMB' });

        // Keywords
        await page.locator('input[placeholder="Enter 4-7 keywords, separated by commas"]').fill('auto, append, rules, testing');

        // Remove pre-populated author (the submitter self)
        await page.getByRole('button', { name: 'Remove' }).click();

        // Add a different co-author
        await page.getByRole('button', { name: '+ Add Author' }).click();
        await page.locator('input[placeholder="Full Name"]').fill('Co Author X');
        await page.locator('input[placeholder="email@example.com"]').fill('coauthor@c5k.com');
        await page.locator('input[placeholder="University Name"]').fill('Test University');

        // Make Co Author X corresponding
        await page.locator('input[type="radio"]').first().check();

        // Upload manuscript
        await uploadFile(page, 'input[type="file"]', 'manuscript.pdf');

        // Submit
        await page.getByRole('button', { name: 'Submit Manuscript' }).click();

        // Verify successful submission
        await expect(page).toHaveURL(/\/dashboard\/submissions\/.+/);

        // Verify Author List has both authors: Co Author X, then Test Author
        await expect(page.getByText('1.Co Author XCorresponding')).toBeVisible();
        await expect(page.getByText('2.Test Author')).toBeVisible();
    });

    test('Mother admin submitting a paper is not auto-assigned as author', async ({ page }) => {
        // Log in as Mother Admin
        await page.goto('/login');
        await page.locator('input[name="email"]').fill('mother.admin@c5k.com');
        await page.locator('input[name="password"]').fill('Password123!');
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL('/dashboard');

        // Go to submit
        await page.goto('/submit');

        // Fill form
        await page.locator('input[placeholder="Enter manuscript title"]').fill('Admin Submission Rule Spec');
        await page.locator('textarea[placeholder="Enter your abstract (150-300 words)"]').fill(
            'This abstract is between 150 and 300 words. Let\'s make it long enough. The submitter author@c5k.com should be appended automatically to the list if they are not in the list explicitly. We are testing this behaviour in this test case. It should place the author at the very end of the list. If they do not add any other co-author, they will be the sole author. If they add other co-authors, they will be placed at the very end of the co-authors sequence list. This ensures regular submitters are always marked as authors of their papers. Testing regular user submit flow for c5k publishing system. We need to add more words to meet the minimum abstract length validation of 150 words. Therefore, we write more descriptions about the submitter auto assignment rule. The rule states that super admins and mother admins are never automatically assigned as authors when they submit a paper. However, all other users are automatically assigned. This is validated.'
        );
        await page.locator('select').first().selectOption({ label: 'JITMB' });
        await page.locator('input[placeholder="Enter 4-7 keywords, separated by commas"]').fill('admin, submission, rules, testing');

        // The list should start empty for Mother Admin. Add one author.
        await page.getByRole('button', { name: '+ Add First Author' }).click();
        await page.locator('input[placeholder="Full Name"]').fill('Academic Author');
        await page.locator('input[placeholder="email@example.com"]').fill('academic.author@c5k.com');
        await page.locator('input[placeholder="University Name"]').fill('Academic Institution');
        await page.locator('input[type="radio"]').first().check();

        // Upload manuscript
        await uploadFile(page, 'input[type="file"]', 'manuscript.pdf');

        // Submit
        await page.getByRole('button', { name: 'Submit Manuscript' }).click();

        // Verify successful submission
        await expect(page).toHaveURL(/\/dashboard\/submissions\/.+/);

        // Verify only Academic Author is listed, and Mother Admin is NOT listed
        await expect(page.getByText('1.Academic AuthorCorresponding')).toBeVisible();
        await expect(page.getByText('Mother Admin')).not.toBeVisible();
    });
});
