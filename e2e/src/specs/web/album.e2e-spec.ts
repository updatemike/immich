import { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Album', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test(`doesn't delete album after canceling add assets`, async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/albums');
    await page.getByRole('button', { name: 'Create album' }).click();
    await page.getByRole('button', { name: 'Select photos' }).click();
    await page.getByRole('button', { name: 'Close' }).click();

    await page.reload();
    await page.getByRole('button', { name: 'Select photos' }).waitFor();
  });

  test('resizes album title font size based on text and viewport size', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.setViewportSize({ width: 1100, height: 1025 });

    await page.goto('/albums');
    await page.getByRole('button', { name: 'Create album' }).click();

    const input = page.getByPlaceholder('Add a title');
    await expect(input).toBeVisible();

    const getFontSize = async () => Number.parseFloat(await input.evaluate((el) => getComputedStyle(el).fontSize));

    await input.pressSequentially('A small title');
    await page.waitForTimeout(100);
    const shortTitleFontSize = await getFontSize();

    await input.clear();
    await input.pressSequentially(
      'A title that is quite large, maybe too large, stop please! A title that is quite large, maybe too large, stop please!',
    );
    await page.waitForTimeout(100);
    const longTitleFontSize = await getFontSize();

    await page.setViewportSize({ width: 600, height: 1025 });
    await page.waitForTimeout(100);
    const smallWindowFontSize = await getFontSize();

    expect(shortTitleFontSize).toBeGreaterThan(longTitleFontSize);
    expect(longTitleFontSize).toBeGreaterThan(smallWindowFontSize);
  });
});
