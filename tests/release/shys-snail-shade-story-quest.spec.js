import { expect, test } from "@playwright/test";

test("Shy's Snail Shade traverses a mixed-material route in the real child player", async ({ page }) => {
  const runtimeErrors = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));

  await page.goto("/preview/child-surfaces.html?surface=story-quests");
  await page.getByRole("button", { name: "Dino", exact: true }).click();

  const questCard = page.getByRole("button").filter({ hasText: "Shy's Snail Shade" });
  await expect(questCard).toBeVisible();
  await expect(questCard.locator("img")).toHaveAttribute(
    "src",
    "/images/story-quests/dino-pals/shy-snail-shade/p01_start.webp"
  );
  await questCard.click();

  const reader = page.getByRole("region", { name: "Shy's Snail Shade Story Quest" });
  await expect(reader).toBeVisible();
  await expect(reader.getByRole("heading", { name: "Shy's Snail Shade" })).toBeVisible();
  await expect(reader).toContainText("Hot sun dries one snail trail.");
  const audioButton = reader.locator(".story-quest-audio-button");
  await expect(audioButton).toBeEnabled();
  await expect(audioButton).toHaveText("Replay audio");
  await audioButton.click();
  await expect(audioButton).toHaveText("Playing audio");

  await reader.getByRole("button", { name: "Slide a broad leaf", exact: true }).click();
  await expect(reader).toContainText("The smooth leaf tips. Back on sand.");
  await expect(reader.locator(".story-quest-image-stage img")).toHaveAttribute(
    "src",
    "/images/story-quests/dino-pals/shy-snail-shade/p02_leaf_failure.webp"
  );

  await reader.getByRole("button", { name: "Try rough bark", exact: true }).click();
  await expect(reader).toContainText("The snail grips it and crawls.");
  await reader.getByRole("button", { name: "Use short pieces", exact: true }).click();
  await expect(reader).toContainText("Three bark pieces cross the hot sand.");

  await reader.getByRole("button", { name: "Finish with moss", exact: true }).click();
  await expect(reader).toContainText("Shy joins the moss into one damp path.");
  await expect(reader.locator(".story-quest-image-stage img")).toHaveAttribute(
    "src",
    "/images/story-quests/dino-pals/shy-snail-shade/p05_moss.webp"
  );

  await reader.getByRole("button", { name: "Under the broad fern", exact: true }).click();
  await expect(reader).toContainText("One feeler peeks past Shy's foot.");
  await expect(reader.getByRole("status")).toContainText("Scene 6");
  await expect(reader.locator(".story-quest-image-stage img")).toHaveAttribute(
    "src",
    "/images/story-quests/dino-pals/shy-snail-shade/p06_fern_ending.webp"
  );

  await reader.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("region", { name: "Shy's Snail Shade complete" })).toBeVisible();

  await page.getByRole("button", { name: "Read again", exact: true }).click();
  await expect(reader).toContainText("Hot sun dries one snail trail.");
  await reader.getByRole("button", { name: "Roll a small twig", exact: true }).click();
  await expect(reader).toContainText("The snail pulls in and stops.");
  await reader.getByRole("button", { name: "Bridge with bark", exact: true }).click();
  await reader.getByRole("button", { name: "Use one strip", exact: true }).click();
  await reader.getByRole("button", { name: "Finish with bark", exact: true }).click();
  await expect(reader).toContainText("It reaches the shaded fern bank.");
  await expect(reader.locator(".story-quest-image-stage img")).toHaveAttribute(
    "src",
    "/images/story-quests/dino-pals/shy-snail-shade/p05_bark.webp"
  );
  await reader.getByRole("button", { name: "Under the old log", exact: true }).click();
  await expect(reader).toContainText("The snail reaches cool bark under the log.");
  await reader.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("region", { name: "Shy's Snail Shade complete" })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
