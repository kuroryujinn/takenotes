import { test, expect } from '@playwright/test';

const requiredEnvVars = [
  'E2E_WALLET_ADDRESS',
  'E2E_ENCRYPTION_SECRET',
  'E2E_NOTE_CONTENT',
];

function hasRequiredEnv(): boolean {
  return requiredEnvVars.every((key) => Boolean(process.env[key] && process.env[key]?.trim().length));
}

test.describe('TakeNotes wallet + IPFS flow', () => {
  test.skip(!hasRequiredEnv(), 'Real wallet/IPFS E2E requires E2E_* environment variables and Freighter setup.');

  test('creates and displays an encrypted note through the UI workflow', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'TakeNotes' })).toBeVisible();

    await page.getByLabel('Encryption secret').fill(process.env.E2E_ENCRYPTION_SECRET as string);

    // Wallet popup automation is environment-specific; this test verifies page-side flow
    // and assumes Freighter connection has already been approved for the browser profile.
    await page.getByRole('button', { name: /connect freighter|reconnect wallet/i }).click();

    await page.getByLabel('Note ID').fill(String(Date.now() % 1_000_000));
    await page.getByLabel('Title').fill('E2E Wallet-IPFS Note');
    await page.getByLabel('Content').fill(process.env.E2E_NOTE_CONTENT as string);
    await page.getByLabel('Tags (comma separated)').fill('e2e,ipfs,wallet');

    await page.getByRole('button', { name: 'Create Note' }).click();

    await expect(page.getByText(/transaction request opened|created on-chain/i)).toBeVisible();
  });
});
