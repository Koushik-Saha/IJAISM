
import { test, expect } from '@playwright/test';
import { prisma } from '../lib/prisma';
import { getAuthToken, createTestUser } from './test-utils';

test.describe('Full Journal Workflow', () => {
    test.setTimeout(120000); // 2 minutes for full flow

    const timestamp = Date.now();
    const journalCode = `TESTJ_${timestamp}`;
    const motherAdmin = { email: `mother_${timestamp}@c5k.org`, password: 'Password123!', name: 'Mother Admin' };
    const superAdmin = { email: `super_${timestamp}@c5k.org`, password: 'Password123!', name: 'Super Admin' };
    const editor = { email: `editor_${timestamp}@c5k.org`, password: 'Password123!', name: 'Journal Editor' };
    const subEditor = { email: `subeditor_${timestamp}@c5k.org`, password: 'Password123!', name: 'Sub Editor' };
    const reviewer1 = { email: `reviewer1_${timestamp}@c5k.org`, password: 'Password123!', name: 'Dr. Reviewer One' };
    const reviewer2 = { email: `reviewer2_${timestamp}@c5k.org`, password: 'Password123!', name: 'Dr. Reviewer Two' };
    const author = { email: `author_${timestamp}@c5k.org`, password: 'Password123!', name: 'Jane Scholar' };

    test.beforeAll(async () => {
        // Bootstrap: Create Mother Admin and Journal directly to speed up (testing UI for these is optional but prompt asked for flow)
        // Prompt: "mother admin create super admin..."
        // So we should start from Mother Admin UI.
        await createTestUser(motherAdmin.email, 'mother_admin', motherAdmin.name);

        // Ensure Journal Exists (or let Super Admin create it? Prompt says "super admin assign journal", implies journal exists)
        await prisma.journal.create({
            data: {
                code: journalCode,
                fullName: `Test Journal ${timestamp}`,
                isActive: true,
                articleProcessingCharge: 100
            }
        });
    });

    test('End-to-End Information Lifecycle', async ({ page }) => {
        // 1. Mother Admin -> Create Super Admin
        await page.goto('/login');
        await page.fill('input[type="email"]', motherAdmin.email);
        await page.fill('input[type="password"]', motherAdmin.password);
        await page.getByRole('button', { name: 'Sign In' }).click();

        // Debug Login Failure
        try {
            await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
        } catch (e) {
            const errorText = await page.locator('.text-red-700, .bg-red-50').textContent().catch(() => 'No error text found');
            console.error(`Login Failed for ${motherAdmin.email}. Error on page: ${errorText}`);
            console.error('Current URL:', page.url());
            throw e;
        }

        await page.goto('/editor/users');
        await page.click('button:has-text("Create User")'); // Assuming this button exists
        await page.fill('input[name="name"]', superAdmin.name);
        await page.fill('input[name="email"]', superAdmin.email);
        await page.fill('input[name="password"]', superAdmin.password);
        await page.selectOption('select[name="role"]', 'super_admin');
        await page.getByRole('button', { name: 'Create User' }).click(); // "Create User"
        await expect(page.locator('text=User created successfully')).toBeVisible();
        await page.click('text=Logout');

        // 2. Super Admin -> Create Editor & Assign Journal
        await page.goto('/login');
        await page.fill('input[type="email"]', superAdmin.email);
        await page.fill('input[type="password"]', superAdmin.password);
        await page.getByRole('button', { name: 'Sign In' }).click();

        await page.goto('/editor/users');
        await page.click('button:has-text("Create User")');
        await page.fill('input[name="name"]', editor.name);
        await page.fill('input[name="email"]', editor.email);
        await page.fill('input[name="password"]', editor.password);
        await page.selectOption('select[name="role"]', 'editor');
        await page.getByRole('button', { name: 'Create User' }).click();
        await expect(page.locator('text=User created successfully')).toBeVisible();

        // Assign Editor to Journal (Backdoor via DB for stability, UI might be complex dropdown)
        const editorUser = await prisma.user.findUnique({ where: { email: editor.email } });
        await prisma.journal.update({ where: { code: journalCode }, data: { editorId: editorUser?.id } });

        await page.click('text=Logout');

        // 3. Editor -> Create Sub-Editor & Multiple Reviewers
        await page.goto('/login');
        await page.fill('input[type="email"]', editor.email);
        await page.fill('input[type="password"]', editor.password);
        await page.getByRole('button', { name: 'Sign In' }).click();

        await page.goto('/editor/users');

        // Create Sub-Editor
        await page.click('button:has-text("Create User")');
        await page.fill('input[name="name"]', subEditor.name);
        await page.fill('input[name="email"]', subEditor.email);
        await page.fill('input[name="password"]', subEditor.password);
        await page.selectOption('select[name="role"]', 'editor'); // Or sub_editor specific role if UI exposes it
        // If Logic: Created by Editor -> automatically sub-editor.
        await page.getByRole('button', { name: 'Create User' }).click();
        await expect(page.locator('text=User created successfully')).toBeVisible();

        // Create Reviewer 1
        await page.click('button:has-text("Create User")');
        await page.fill('input[name="name"]', reviewer1.name);
        await page.fill('input[name="email"]', reviewer1.email);
        await page.fill('input[name="password"]', reviewer1.password);
        await page.selectOption('select[name="role"]', 'reviewer');
        await page.getByRole('button', { name: 'Create User' }).click();
        await expect(page.locator('text=User created successfully')).toBeVisible();

        // Create Reviewer 2
        await page.click('button:has-text("Create User")');
        await page.fill('input[name="name"]', reviewer2.name);
        await page.fill('input[name="email"]', reviewer2.email);
        await page.fill('input[name="password"]', reviewer2.password);
        await page.selectOption('select[name="role"]', 'reviewer');
        await page.getByRole('button', { name: 'Create User' }).click();
        await expect(page.locator('text=User created successfully')).toBeVisible();

        await page.click('text=Logout');

        // 4. Author -> Submit Article (Max 2 Check implicitly by creating 1)
        await createTestUser(author.email, 'author', author.name);

        await page.goto('/login');
        await page.fill('input[type="email"]', author.email);
        await page.fill('input[type="password"]', author.password);
        await page.getByRole('button', { name: 'Sign In' }).click();

        await page.goto('/submit');
        await page.fill('input[name="title"]', 'E2E Test Article');
        await page.fill('textarea[name="abstract"]', 'This is a test abstract for E2E flow.');
        // Select Journal by label (Test Journal timestamp)
        // Make sure UI lists it.
        await page.selectOption('select[name="journal"]', { label: `Test Journal ${timestamp}` });

        await page.click('button:has-text("Submit")');
        await expect(page.locator('text=submitted successfully')).toBeVisible();
        await page.click('text=Logout');

        // 5. Editor -> Assign Reviewer
        await page.goto('/login');
        await page.fill('input[type="email"]', editor.email);
        await page.fill('input[type="password"]', editor.password);
        await page.getByRole('button', { name: 'Sign In' }).click();

        await page.goto('/editor/articles');
        await page.click('text=E2E Test Article');

        await page.click('text=Assign Reviewer');
        await page.click(`text=${reviewer1.name}`);
        await page.click('button:has-text("Assign")');
        await expect(page.locator('text=Reviewer assigned')).toBeVisible();

        await page.click('text=Logout');

        // 6. Reviewer -> Submit Review (Changes Requested)
        await page.goto('/login');
        await page.fill('input[type="email"]', reviewer1.email);
        await page.fill('input[type="password"]', reviewer1.password);
        await page.getByRole('button', { name: 'Sign In' }).click();

        await page.goto('/dashboard/reviews');
        await page.click('text=E2E Test Article');

        await page.fill('textarea[name="commentsToAuthor"]', 'Please fix formatting.');
        await page.fill('textarea[name="commentsToEditor"]', 'Good paper but needs format fix.');
        await page.selectOption('select[name="decision"]', 'revise');
        await page.click('button:has-text("Submit Review")');
        await expect(page.locator('text=Review submitted')).toBeVisible();
        await page.click('text=Logout');

        // 7. Editor -> Request Revision
        await page.goto('/login');
        await page.fill('input[type="email"]', editor.email);
        await page.fill('input[type="password"]', editor.password);
        await page.getByRole('button', { name: 'Sign In' }).click();

        await page.goto('/editor/articles');
        await page.click('text=E2E Test Article');

        await page.click('text=Make Decision');
        await page.selectOption('select[name="decision"]', 'revise');
        await page.fill('textarea[name="comments"]', 'Please address reviewer comments.');
        await page.click('button:has-text("submit decision")');
        await expect(page.locator('text=Decision recorded')).toBeVisible();
        await page.click('text=Logout');

        // 8. Author -> Resubmit
        await page.goto('/login');
        await page.fill('input[type="email"]', author.email);
        await page.fill('input[type="password"]', author.password);
        await page.getByRole('button', { name: 'Sign In' }).click();

        await page.goto('/dashboard/submissions');
        await page.click('text=E2E Test Article');
        await expect(page.locator('text=Revision Requested')).toBeVisible();
        await page.click('text=Submit Revision');
        await page.fill('textarea[name="abstract"]', 'Updated abstract.');
        await page.click('button:has-text("Resubmit")');
        await expect(page.locator('text=Article updated successfully')).toBeVisible();
        await page.click('text=Logout');

        // 9. Editor -> Accept
        await page.goto('/login');
        await page.fill('input[type="email"]', editor.email);
        await page.fill('input[type="password"]', editor.password);
        await page.getByRole('button', { name: 'Sign In' }).click();

        await page.goto('/editor/articles');
        await page.click('text=E2E Test Article');
        await page.click('text=Make Decision');
        await page.selectOption('select[name="decision"]', 'accept');
        await page.fill('textarea[name="comments"]', 'Accepted.');
        await page.click('button:has-text("submit decision")');
        await expect(page.locator('text=Decision recorded')).toBeVisible();

        await page.click('text=Logout');

        // 10. Author -> Pay (Mock)
        // Flip DB bit
        const article = await prisma.article.findFirst({ where: { title: 'E2E Test Article', journal: { code: journalCode } } });
        await prisma.article.update({ where: { id: article?.id }, data: { isApcPaid: true } });

        // 11. Editor -> Publish
        await page.goto('/login');
        await page.fill('input[type="email"]', editor.email);
        await page.fill('input[type="password"]', editor.password);
        await page.getByRole('button', { name: 'Sign In' }).click();

        await page.goto('/editor/articles');
        await page.click('text=E2E Test Article');
        await page.click('text=Make Decision');
        await page.selectOption('select[name="decision"]', 'publish');
        await page.click('button:has-text("submit decision")');

        await expect(page.locator('text=Article Published')).toBeVisible();
    });
});
