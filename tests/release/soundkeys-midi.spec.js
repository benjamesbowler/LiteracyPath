import { expect, test } from "@playwright/test";

async function installMidiMock(page, { denied = false } = {}) {
  await page.addInitScript(({ shouldDeny }) => {
    const input = {
      id: "classroom-keys",
      name: "Classroom Keys",
      type: "input",
      state: "connected",
      connection: "closed",
      onmidimessage: null,
      async open() { this.connection = "open"; }
    };
    const stateListeners = new Set();
    const access = {
      inputs: new Map([[input.id, input]]),
      addEventListener(type, listener) {
        if (type === "statechange") stateListeners.add(listener);
      },
      removeEventListener(type, listener) {
        if (type === "statechange") stateListeners.delete(listener);
      }
    };
    Object.defineProperty(navigator, "requestMIDIAccess", {
      configurable: true,
      value: async () => {
        if (shouldDeny) throw new DOMException("Permission denied", "NotAllowedError");
        return access;
      }
    });
    window.soundKeysMidiTest = {
      pressMany(notes) {
        notes.forEach(note => input.onmidimessage?.({ data: Uint8Array.from([0x90, note, 100]) }));
      }
    };
  }, { shouldDeny: denied });
}

test("SoundKeys connects a MIDI keyboard and builds a word from rapid notes", async ({ page }) => {
  await installMidiMock(page);
  await page.goto("/soundkeys");

  await page.getByRole("button", { name: "Connect MIDI", exact: true }).click();
  await expect(page.getByText("MIDI ready", { exact: true })).toBeVisible();
  await expect(page.getByText("Classroom Keys is ready. Play a key.", { exact: true })).toBeVisible();

  await page.evaluate(() => window.soundKeysMidiTest.pressMany([58, 49, 50]));

  await expect(page.getByRole("heading", { level: 1, name: "CAT", exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Classroom Keys: note 50 plays t.");
});

test("SoundKeys gives recovery guidance when MIDI permission is denied", async ({ page }) => {
  await installMidiMock(page, { denied: true });
  await page.goto("/soundkeys");

  await page.getByRole("button", { name: "Connect MIDI", exact: true }).click();

  await expect(page.getByText(/MIDI permission is blocked/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect MIDI", exact: true })).toBeEnabled();
});
