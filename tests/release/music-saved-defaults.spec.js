import { expect, test } from '@playwright/test';
import { GAME_LIST } from '../../src/data/learnGamesData.js';

test.setTimeout(90_000);

async function openSavedGame(page, game, seed = true) {
  await page.goto('/tests/fixtures/music-migration.html');
  await page.evaluate(async ({ game, seed }) => {
    window.__musicPlays = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      if (this.src.includes('/music/')) window.__musicPlays.push(this.src);
      return play.apply(this, args);
    };
    if (seed) localStorage.setItem('literacy-guide-learn-games:music-test', JSON.stringify({ soundEnabled: true, musicEnabled: true, games: {} }));
    localStorage.setItem('lp-open-game', game);
    localStorage.setItem(`lp-arcade-onboarded-v1:${game}`, '1');
    const { mountSavedArcade } = await import('/tests/fixtures/musicMigrationHarness.jsx');
    mountSavedArcade();
  }, { game, seed });
  await expect(page.locator('.lg-game-loading')).toHaveCount(0, { timeout: 60_000 });
}

for (const game of GAME_LIST.filter(game => !game.hidden)) {
  test(`${game.id}: an old music-on save starts quiet with speech enabled`, async ({ page }) => {
    await openSavedGame(page, game.id);
    const player = page.getByRole('dialog', { name: game.title, exact: true });
    await expect(player.getByRole('button', { name: 'Turn music on', exact: true })).toHaveAttribute('aria-pressed', 'false');
    await expect(player.getByRole('button', { name: 'Turn spoken audio and game sounds off', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => window.__musicPlays)).toEqual([]);
  });
}

test('a new music opt-in persists when a returning player opens another game', async ({ page }) => {
  await openSavedGame(page, 'sound-racer');
  const player = page.getByRole('dialog', { name: 'Sound Racer', exact: true });
  await player.getByRole('button', { name: 'Turn music on', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('literacy-guide-learn-games:music-test')).musicEnabled)).toBe(true);
  await openSavedGame(page, 'sound-beat', false);
  await expect(page.getByRole('dialog', { name: 'Sound Beat', exact: true }).getByRole('button', { name: 'Turn music off; spoken audio stays on', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
