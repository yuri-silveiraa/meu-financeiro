import { test as base, expect } from '@playwright/test';

// Mock Google OAuth response for testing
const MOCK_GOOGLE_CREDENTIAL = 'mock-google-credential-for-testing';
const MOCK_USER = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: null,
};

export const test = base.extend({
  // Auto-login fixture: bypass Google OAuth
  authenticatedPage: async ({ page }, use) => {
    // Intercept the Google login API call
    await page.route('**/auth/google', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token-for-e2e-testing',
          user: MOCK_USER,
        }),
      });
    });

    // Intercept /auth/me to return the mock user
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_USER }),
      });
    });

    // Navigate to login page
    await page.goto('/login');

    // Set the token in localStorage to simulate a logged-in state
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-jwt-token-for-e2e-testing');
    });

    // Navigate to the app
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    await use(page);
  },
});

export { expect };
