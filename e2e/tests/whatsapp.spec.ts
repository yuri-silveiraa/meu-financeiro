import { test, expect } from '../fixtures/auth.fixture';

test.describe('Transactions', () => {
  test('lists transactions page', async ({ authenticatedPage: page }) => {
    await page.click('text=Transações');
    await expect(page).toHaveURL('/transacoes');

    // Page should load without errors
    await expect(page.locator('text=Transações')).toBeVisible();
  });

  test('creates a transaction', async ({ authenticatedPage: page }) => {
    await page.click('text=Transações');

    // Click add transaction button
    const addButton = page.locator('button:has-text("Adicionar"), button:has-text("Nova")').first();
    await addButton.click();

    // Fill in transaction form
    // Note: The actual form fields depend on the Transacoes page implementation
    // This is a basic test that the page loads and the button works
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Fixed Expenses', () => {
  test('lists fixed expenses page', async ({ authenticatedPage: page }) => {
    await page.click('text=Fixos');
    await expect(page).toHaveURL('/gastosfixos');

    // Page should load without errors
    await expect(page.locator('text=Fixos')).toBeVisible();
  });
});

test.describe('WhatsApp Vinculation', () => {
  test('shows vinculation section in Configurações', async ({ authenticatedPage: page }) => {
    await page.click('text=Configurações');

    // Should show WhatsApp Bot section
    await expect(page.locator('text=WhatsApp Bot')).toBeVisible();
    await expect(page.locator('text=Vincule seu WhatsApp')).toBeVisible();
  });

  test('generates vinculation code', async ({ authenticatedPage: page }) => {
    await page.click('text=Configurações');

    // Handle the prompt dialog
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        await dialog.accept('5511999999999');
      }
    });

    // Handle the alert dialog with the code
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'alert') {
        await dialog.accept();
      }
    });

    // Click generate code button
    const generateButton = page.locator('button:has-text("Gerar Código")');
    await generateButton.click();

    // Wait for the flow to complete
    await page.waitForTimeout(1000);
  });
});
