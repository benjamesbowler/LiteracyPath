import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Teach keeps five daily destinations and exact tasks while utilities stay reachable', async ({page}) => {
  await page.goto('/preview/teacher-a11y.html?surface=resources&context=1');
  const primary = page.getByTestId('teacher-primary-nav');
  await expect(primary.getByRole('button')).toHaveCount(5);
  for (const name of ['Dashboard', 'Teach', 'Students', 'Assessments', 'Reports']) await expect(primary.getByRole('button', { name, exact: true })).toBeVisible();
  await expect(page.getByRole('button', {name:'Settings', exact:true})).toBeVisible();
  await expect(page.getByText('READ42',{exact:true})).not.toBeVisible();
  await page.locator('.tcb-sign-in > summary').click();
  await expect(page.getByText('READ42',{exact:true})).toBeVisible();
  await page.getByRole('combobox', {name:'Class teaching cycle',exact:true}).selectOption('cycle-9');
  await expect(page.getByRole('button',{name:'Open Cycle 9 slides'})).toBeVisible();
  await page.getByRole('button',{name:'Help',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Practice is separate');
  await page.getByRole('button',{name:'Close Help'}).press('Escape');
  await expect(page.getByRole('button',{name:'Help',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Build a worksheet'}).click();
  await expect(page).toHaveURL(/surface=worksheets&cycle=cycle-9/);
  await expect(page.getByRole('combobox',{name:'Teaching cycle'})).toHaveValue('cycle-9');
});

test('student primary action follows current adequate or sparse results and keeps other actions', async ({page}) => {
  await page.goto('/preview/teacher-a11y.html?surface=classes&focus-evidence=1');
  await page.getByRole('button',{name:'View Aisha',exact:true}).click();
  const panel=page.getByRole('region',{name:'Student details: Aisha'});
  await expect(panel.getByRole('button',{name:'Plan focused practice for Aisha'})).toBeVisible();
  await panel.getByRole('button',{name:'Plan focused practice for Aisha'}).click();
  await expect.poll(() => page.evaluate(() => window.__teacherPreviewFocusedPractice)).toEqual({studentId:'student-aisha',focus:'Initial Sounds'});
  await expect(panel.getByRole('button',{name:'Start assessment',exact:true})).toBeVisible();
  await page.goto('/preview/teacher-a11y.html?surface=classes&focus-evidence=1&focus-sparse=1&learner=1');
  await expect(page.getByRole('button',{name:'Start assessment for Aarav'})).toBeVisible();
});

test('Settings opens a named student task and asks who when no student is selected', async ({page}) => {
  await page.goto('/preview/teacher-a11y.html?surface=settings');
  await page.getByRole('button',{name:'Open accessibility',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Choose a student to change learning support');
  await page.getByRole('combobox',{name:'Student',exact:true}).selectOption('student-aisha');
  await expect(page.getByRole('dialog')).toContainText('Aisha');
  await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
});

for (const width of [1366,1024,768,390]) test(`Teach is usable with complete controls at ${width}px`, async ({page}) => {
  await page.setViewportSize({width,height:900});
  await page.goto('/preview/teacher-a11y.html?surface=resources&context=1');
  await expect(page.getByRole('button',{name:'Browse books',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Read together',exact:true})).toBeVisible();
  const overflow=await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  expect(overflow).toBe(false);
  const failures=await new AxeBuilder({page}).include('.lg-content-area').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(failures.violations).toEqual([]);
  await page.screenshot({path:`.artifacts/teacher-simplicity/teach-${width}.png`,fullPage:true});
});
