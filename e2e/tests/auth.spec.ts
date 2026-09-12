import { test, expect } from '../fixtures/auth.fixture';

test.describe('Authentication', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    // Clear any existing token
    await page.evaluate(() => localStorage.clear());

    // Navigate to the app
    await page.goto('/');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page shows Google button', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');

    // Check that the login page has a Google login button
    const googleButton = page.locator('text=Entrar com Google');
    await expect(googleButton).toBeVisible();
  });

  test('successful login stores token and redirects to dashboard', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');

    // Click the Google login button
    const googleButton = page.locator('text=Entrar com Google');
    await googleButton.click();

    // Wait for navigation to dashboard
    await page.waitForURL('/', { timeout: 10000 });

    // Verify token is stored
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('logout clears session and redirects to login', async ({ page, authenticatedPage }) => {
    // Click the user menu dropdown
    const userMenu = page.locator('button:has-text("Test User")');
    await userMenu.click();

    // Click logout
    const logoutButton = page.locator('text=Sair');
    await logoutButton.click();

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);

    // Verify token is cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});
