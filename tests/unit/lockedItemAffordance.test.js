import assert from "node:assert/strict";
import test from "node:test";

import {
  LOCKED_ITEM_AFFORDANCE_VERSION,
  lockedItemAffordance
} from "../../src/policy/lockedItemAffordance.js";
import { HOLLOW_ITEMS } from "../../src/utils/hollowEconomy.js";

test("locked item copy names the price, currency, and exact shortfall", () => {
  assert.deepEqual(
    lockedItemAffordance({ cost: 20, balance: 8 }),
    {
      version: LOCKED_ITEM_AFFORDANCE_VERSION,
      cost: 20,
      balance: 8,
      shortfall: 12,
      locked: true,
      priceText: "20 coins",
      text: "20 coins — earn 12 more"
    }
  );
  assert.equal(
    lockedItemAffordance({
      cost: 20,
      balance: 8,
      currency: { singular: "Spark", plural: "Sparks" }
    }).text,
    "20 Sparks — earn 12 more"
  );
});

test("locked item copy clamps invalid values and handles singular currency", () => {
  assert.equal(lockedItemAffordance({ cost: 1, balance: -4 }).text, "1 coin — earn 1 more");
  assert.deepEqual(
    lockedItemAffordance({ cost: "bad", balance: 12 }),
    {
      version: LOCKED_ITEM_AFFORDANCE_VERSION,
      cost: 0,
      balance: 12,
      shortfall: 0,
      locked: false,
      priceText: "0 coins",
      text: "0 coins"
    }
  );
});

test("the Hollow has a genuine 20-coin market item for the documented affordance", () => {
  const item = HOLLOW_ITEMS.find(candidate => candidate.id === "hollow-glow-jar");
  assert.equal(item?.price, 20);
});
