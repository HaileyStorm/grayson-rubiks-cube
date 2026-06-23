import { expect, test } from '@playwright/test';

async function waitForCube(page) {
  await page.waitForFunction(() => Boolean(window.__cherryCube));
  try {
    await page.waitForFunction(
      () => {
        const state = window.__cherryCube.debugState();
        return !state.animating && state.pending === 0;
      },
      null,
      { timeout: 60_000 }
    );
  } catch {
    const state = await page.evaluate(() => window.__cherryCube.debugState());
    throw new Error(`Cube did not become idle: ${JSON.stringify(state)}`);
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__CHERRY_CUBE_FAST = true;
  });
});

test.setTimeout(120_000);

test('desktop initial cube, face moves, and keyboard inverse', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForCube(page);
  await expect(page.getByTestId('cube-canvas')).toBeVisible();
  await expect(page.getByTestId('status')).toContainText('ready');
  await expect(page.getByTestId('move-log')).toContainText('No moves yet');
  await page.screenshot({ path: 'verification-screenshots/desktop-01-initial-solved.png' });

  const startSignature = await page.evaluate(() => window.__cherryCube.signature());
  await page.getByTestId('move-Rcw').click();
  await waitForCube(page);
  await expect(page.getByTestId('move-log')).toContainText('R');
  expect(await page.evaluate(() => window.__cherryCube.signature())).not.toBe(startSignature);

  await page.keyboard.press('Shift+R');
  await waitForCube(page);
  expect(await page.evaluate(() => window.__cherryCube.isSolved())).toBe(true);

  await page.evaluate(() => window.__cherryCube.enqueueMany("U D L R F B U' D' L' R' F' B' U2 D2 L2 R2 F2 B2"));
  await waitForCube(page);
  await expect(page.getByTestId('status')).toContainText('Completed');
  await page.screenshot({ path: 'verification-screenshots/desktop-02-face-moves.png' });
});

test('desktop scramble and solved reset', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForCube(page);
  await page.getByTestId('scramble').click();
  await waitForCube(page);
  expect(await page.evaluate(() => window.__cherryCube.isSolved())).toBe(false);
  await expect(page.getByTestId('move-log')).toContainText('Scramble');
  await page.screenshot({ path: 'verification-screenshots/desktop-03-scrambled.png' });

  await page.getByTestId('reset').click();
  await waitForCube(page);
  expect(await page.evaluate(() => window.__cherryCube.isSolved())).toBe(true);
  await page.screenshot({ path: 'verification-screenshots/desktop-04-reset.png' });
});

test('desktop presets, algorithm queue, camera controls, and mouse orbit', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForCube(page);

  await page.getByTestId('daisy').click();
  await waitForCube(page);
  await expect(page.getByTestId('move-log')).toContainText('Daisy');
  await page.screenshot({ path: 'verification-screenshots/desktop-05-daisy.png' });

  await page.getByTestId('white-cross').click();
  await waitForCube(page);
  await expect(page.getByTestId('move-log')).toContainText('White cross');
  expect(await page.evaluate(() => window.__cherryCube.isSolved())).toBe(false);
  await page.screenshot({ path: 'verification-screenshots/desktop-06-white-cross.png' });

  await page.getByTestId('algorithm-novice-right-hand-trigger').click();
  await waitForCube(page);
  await expect(page.getByTestId('move-log')).toContainText("R'");

  await page.getByTestId('view-iso').click();
  await page.mouse.move(620, 420);
  await page.mouse.down();
  await page.mouse.move(720, 340);
  await page.mouse.up();
  await page.mouse.wheel(0, -350);
  await page.getByTestId('view-iso').click();
  await expect(page.getByTestId('status')).toContainText('iso');
  await page.screenshot({ path: 'verification-screenshots/desktop-07-camera-algorithm.png' });
});

test('mobile layout remains usable and screenshots render', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await waitForCube(page);
  await expect(page.getByTestId('cube-canvas')).toBeVisible();
  await page.getByTestId('move-Ucw').click();
  await waitForCube(page);
  await expect(page.getByTestId('move-log')).toContainText('U');
  await page.getByTestId('scramble').click();
  await waitForCube(page);
  await expect(page.getByTestId('move-log')).toContainText('Scramble');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'verification-screenshots/mobile-01-scrambled.png' });
});
