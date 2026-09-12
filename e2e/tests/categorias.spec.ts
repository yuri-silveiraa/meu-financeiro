import { test, expect } from '../fixtures/auth.fixture';

test.describe('Categories (via Configurações)', () => {
  test('lists default categories', async ({ authenticatedPage: page }) => {
    // Navigate to Configurações
    await page.click('text=Configurações');
    await expect(page).toHaveURL('/configuracoes');

    // Should show categories section
    await expect(page.locator('text=Categorias')).toBeVisible();
  });

  test('creates a new category', async ({ authenticatedPage: page }) => {
    await page.click('text=Configurações');

    // Click "Nova" button for categories
    const novaButton = page.locator('button:has-text("Nova")').first();
    await novaButton.click();

    // Fill in the category name
    await page.fill('input[type="text"]', 'Teste E2E');

    // Click save
    await page.click('button:has-text("Salvar")');

    // The modal should close and the new category should appear
    await expect(page.locator('text=Teste E2E')).toBeVisible();
  });

  test('deletes a category with confirmation', async ({ authenticatedPage: page }) => {
    await page.click('text=Configurações');

    // Create a category first
    const novaButton = page.locator('button:has-text("Nova")').first();
    await novaButton.click();
    await page.fill('input[type="text"]', 'Para Deletar');
    await page.click('button:has-text("Salvar")');
    await expect(page.locator('text=Para Deletar')).toBeVisible();

    // Handle the confirmation dialog
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Click delete button for the category
    const deleteButton = page.locator('[aria-label="Excluir categoria"]').first();
    await deleteButton.click();

    // Category should be removed
    await expect(page.locator('text=Para Deletar')).not.toBeVisible();
  });
});
