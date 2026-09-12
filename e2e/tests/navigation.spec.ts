import { test, expect } from '../fixtures/auth.fixture';

test.describe('Navigation', () => {
  test('sidebar navigates to all pages', async ({ authenticatedPage: page }) => {
    // Dashboard should be the default page
    await expect(page).toHaveURL('/');

    // Navigate to Transacoes
    await page.click('text=Transações');
    await expect(page).toHaveURL('/transacoes');

    // Navigate to Fixos
    await page.click('text=Fixos');
    await expect(page).toHaveURL('/gastosfixos');

    // Navigate to Relatórios
    await page.click('text=Relatórios');
    await expect(page).toHaveURL('/relatorios');

    // Navigate to Metas
    await page.click('text=Metas');
    await expect(page).toHaveURL('/metas');

    // Navigate to Configurações
    await page.click('text=Configurações');
    await expect(page).toHaveURL('/configuracoes');
  });

  test('unknown route redirects to dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/nonexistent-route-12345');
    await expect(page).toHaveURL('/');
  });
});
