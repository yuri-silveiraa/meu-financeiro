import { test, expect } from '../fixtures/auth.fixture';

test.describe('Accounts (via Configurações)', () => {
  test('creates a new account', async ({ authenticatedPage: page }) => {
    await page.click('text=Configurações');

    // Click "Nova" button for accounts (second "Nova" button)
    const novaButtons = page.locator('button:has-text("Nova")');
    const novaContaButton = novaButtons.nth(1);
    await novaContaButton.click();

    // Fill in the account form
    await page.fill('input[type="text"]:first-of-type', 'Nubank E2E');
    await page.fill('input[type="text"]:nth-of-type(2)', 'Nubank');

    // Click save
    await page.click('button:has-text("Salvar")');

    // The account should appear
    await expect(page.locator('text=Nubank E2E')).toBeVisible();
  });

  test('deletes an account with confirmation', async ({ authenticatedPage: page }) => {
    await page.click('text=Configurações');

    // Create an account first
    const novaButtons = page.locator('button:has-text("Nova")');
    const novaContaButton = novaButtons.nth(1);
    await novaContaButton.click();
    await page.fill('input[type="text"]:first-of-type', 'Conta Para Deletar');
    await page.fill('input[type="text"]:nth-of-type(2)', 'Banco Teste');
    await page.click('button:has-text("Salvar")');
    await expect(page.locator('text=Conta Para Deletar')).toBeVisible();

    // Handle the confirmation dialog
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Click delete button for the account
    const deleteButton = page.locator('[aria-label="Excluir conta"]').first();
    await deleteButton.click();

    // Account should be removed
    await expect(page.locator('text=Conta Para Deletar')).not.toBeVisible();
  });
});
