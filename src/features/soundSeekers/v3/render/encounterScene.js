// Sound Seekers v3 — the encounter: a side-scrolling platform area where the
// puzzle is built into the scenery, one "room" per beat.
//
// Movement (walk, jump, auto-walk) is how the child reaches a decision;
// it never makes the decision. Every pick goes to onAction() and the scene
// only animates what the authority reports back through applyOutcome().
//
// Design space is 1470 × 831 (scaled to the viewport height). Physics values
// are the proven ones from LetterLeapGame (gravity .62, move 4.8, jump 13.6,
// coyote time, jump buffer, variable jump), stepped at a fixed 60 Hz.

import { BACKDROPS, GROUND_PALETTES } from "../content/trail.js";
import { CAST } from "../content/cast.js";
import { MECHANICS } from "../engine/challenges.js";
import { createRng } from "../engine/rng.js";
import { createPuppet, drawPuppet, getImage, squashPuppet, tickPuppet } from "./sprites.js";
import {
  BERRY, CREAM, FONT_DISPLAY, FONT_LETTER, GOLD, INK, LEAF, LEAF_DEEP, PALETTE, WOOD, WOOD_DEEP,
  arrow, basket, bridge, bush, cloud, crate, door, dust, frame, gate, ground, heartShape, hill, inkFill, key as keyProp, label,
  lantern, platform, roundRect, signpost, sparkle, speechBubble, stone, stump, tile, water, wrapText
} from "./paint.js";

export const DESIGN_H = 831;
const GY = 660;               // ground top (design px)
const GRAV = 0.62;
const MOVE = 4.8;
const JUMP = 13.6;
const STEP = 1 / 60;
const HERO_W = 58;
const HERO_H = 128;
const REACH = 150;
const ROOM_W = 1150;

function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function easeOut(t) { return 1 - (1 - t) * (1 - t); }
function easeBack(t) { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

export function createEncounterScene({ stop, mission, heroId, onAction, onHear, reducedMotion = false, fx = null }) {
  const pal = GROUND_PALETTES[stop.backdrop] || GROUND_PALETTES["seedwake-meadow"];
  const npc = CAST[stop.character];
  const hero = CAST[heroId];
  const rng = createRng(mission.seed || 1);

  const s = {
    t: 0,
    acc: 0,
    beatIndex: 0,
    rooms: [],
    levelW: 0,
    camX: 0,
    camTarget: 0,
    view: { w: 1470, h: DESIGN_H, scale: 1 },
    hero: { x: 240, y: GY, vx: 0, vy: 0, onGround: true, facing: 1, coyote: 0, buffer: 0, jumpHeld: false, walkTo: null, walkThen: null, puppet: createPuppet(), anim: "idle", celebrateT: 0, sadT: 0 },
    npc: { x: 600, y: GY, targetX: 600, facing: -1, puppet: createPuppet(), anim: "talk", bubble: null, bubbleT: 0, pointAt: null },
    input: { left: false, right: false, jump: false },
    tweens: [],
    particles: [],
    banner: null,
    complete: false,
    finale: null,
    reducedMotion,
    beatStates: [],
    clouds: Array.from({ length: 6 }, (_, i) => ({ x: i * 520 + rng.int(200), y: 70 + rng.int(120), w: 120 + rng.int(120), v: 6 + rng.int(8) }))
  };

  // ── level construction ─────────────────────────────────────────────────
  function buildRooms() {
    let x = 0;
    mission.beats.forEach((beat, i) => {
      const room = buildRoom(beat, i, x);
      s.rooms.push(room);
      x += room.w;
    });
    // finale room: the repaired landmark
    s.rooms.push({ beatIndex: mission.beats.length, kind: "finale", x0: x, x1: x + 900, w: 900, objects: [], platforms: [], gapStart: null });
    s.levelW = x + 900;
  }

  function obj(o) { return { glow: 0, scale: 1, wobble: 0, rot: 0, dy: 0, alpha: 1, ...o }; }

  function buildRoom(beat, index, x0) {
    const v = beat.view;
    const room = { beat, beatIndex: index, x0, w: ROOM_W, x1: x0 + ROOM_W, objects: [], platforms: [], water: null, landmark: null, fenceOpen: 0, kind: beat.mechanic, done: false };
    const gx = dx => x0 + dx;
    switch (beat.mechanic) {
      case MECHANICS.SIGNPOST: {
        const n = v.cards.length;
        room.w = Math.max(ROOM_W, 420 + n * 280);
        room.x1 = x0 + room.w;
        v.cards.forEach((card, i) => {
          room.objects.push(obj({ id: `card:${card.targetId}`, kind: "signpost", card, x: gx(300 + i * 280), y: GY - 300, w: 220, h: 300, role: "hear", heard: false }));
        });
        break;
      }
      case MECHANICS.ECHO_HUNT: {
        const heights = createRng(beat.seed * 1000).shuffle([0, 190, 95]);
        v.options.forEach((o, i) => {
          const px = gx(300 + i * 250);
          const h = heights[i];
          if (h > 0) room.platforms.push({ x: px - 40, y: GY - h, w: 200, h: 36 });
          room.objects.push(obj({ id: o.id, kind: "crate", option: o, x: px, y: GY - h - 120, w: 120, h: 120, role: "pick" }));
        });
        room.landmark = { kind: "lanternPost", x: gx(1010), lit: 0 };
        break;
      }
      case MECHANICS.SOUND_SORT: {
        v.bins.forEach((b, i) => room.objects.push(obj({ id: b.id, kind: "basket", bin: b, x: gx(300 + i * 480), y: GY - 130, w: 200, h: 130, role: "pick", fill: 0 })));
        room.objects.push(obj({ id: "item", kind: "item", x: gx(540), y: GY - 380, w: 200, h: 150, role: "hear", itemIndex: 0, visible: true }));
        break;
      }
      case MECHANICS.WORD_FORGE: {
        const n = v.tiles.length;
        const startX = 260; // the hero spawns at +160 and the character waits at +60, both clear of the tiles
        v.tiles.forEach((t, i) => {
          const px = gx(startX + i * 150); // a hero standing between two tiles hides neither
          const raised = i % 2 === 1 ? 70 : 0;
          room.objects.push(obj({ id: t.id, kind: "tile", tile: t, x: px, y: GY - 90 - raised, w: 92, h: 78, role: "pick", home: { x: px, y: GY - 90 - raised }, placed: false }));
          room.objects.push(obj({ id: `stump:${t.id}`, kind: "stump", x: px + 10, y: GY - raised - 8, w: 72, h: 30 + raised, role: "none" }));
        });
        room.w = Math.max(ROOM_W, startX + n * 150 + 620);
        room.x1 = x0 + room.w;
        room.water = { x: room.x1 - 560, w: 430 };
        room.bridgeX = room.x1 - 560;
        room.bridgeW = 430;
        room.objects.push(obj({ id: "wordframe", kind: "wordframe", x: gx(startX + n * 60 - 90), y: GY - 420, w: 180, h: 150, role: "hear" }));
        break;
      }
      case MECHANICS.BLEND_BRIDGE: {
        const n = v.stones.length;
        room.water = { x: gx(330), w: 140 * n + 120 };
        v.stones.forEach((st, i) => {
          const px = gx(390 + i * 140);
          room.platforms.push({ x: px - 10, y: GY - 10, w: 130, h: 40, stone: st.id });
          room.objects.push(obj({ id: st.id, kind: "stone", stone: st, x: px, y: GY - 28, w: 110, h: 56, role: "pick", lit: false }));
        });
        room.w = Math.max(ROOM_W, 330 + 140 * n + 120 + 620);
        room.x1 = x0 + room.w;
        const optX = room.water.x + room.water.w + 90;
        v.options.forEach((o, i) => room.objects.push(obj({ id: o.id, kind: "optionSign", option: o, x: optX + i * 170, y: GY - 230, w: 140, h: 230, role: "pick", visible: false })));
        room.objects.push(obj({ id: "blendword", kind: "blendword", x: room.water.x, y: GY - 400, w: room.water.w, h: 120, role: "none", visible: false, text: "" }));
        break;
      }
      case MECHANICS.HEART_LANTERN: {
        room.objects.push(obj({ id: "tree", kind: "tree", x: gx(560), y: GY, w: 200, h: 520, role: "none" }));
        // the model word hangs from its own post on the left; the choices hang
        // under the lantern tree, spread so none sits under another
        const bigW = Math.min(330, Math.max(180, v.letters.length * 56 + 60));
        room.objects.push(obj({ id: "bigLantern", kind: "bigLantern", x: gx(190) - bigW / 2, y: GY - 470, w: bigW, h: 225, role: "hear", lit: true }));
        v.options.forEach((o, i) => room.objects.push(obj({ id: o.id, kind: "wordLantern", option: o, x: gx(440 + i * 190), y: GY - 200, w: 110, h: 138, role: "pick", visible: false, lit: false })));
        // once the word is found, the same lantern shows it inside a phrase
        break;
      }
      case MECHANICS.GATE_RIDDLE: {
        v.keys.forEach((k, i) => {
          room.objects.push(obj({ id: k.id, kind: "key", keyOption: k, x: gx(220 + i * 230), y: GY - 250, w: 170, h: 44, role: "pick", heard: false, selected: false }));
          room.objects.push(obj({ id: `hook:${k.id}`, kind: "hook", x: gx(220 + i * 230) + 24, y: GY - 300, role: "none" }));
        });
        room.objects.push(obj({ id: "gate", kind: "gate", x: gx(880), y: GY - 220, w: 200, h: 220, role: "none", open: 0 }));
        room.objects.push(obj({ id: "ruleboard", kind: "ruleboard", x: gx(540), y: GY - 470, w: 520, h: 130, role: "hear" }));
        break;
      }
      case MECHANICS.STORY_BRIDGE: {
        room.objects.push(obj({ id: "board", kind: "board", x: gx(260), y: GY - 420, w: 480, h: 200, role: "hear", highlight: -1 }));
        v.choices.forEach((c, i) => room.objects.push(obj({ id: c.id, kind: "door", choice: c, x: gx(780 + i * 200), y: GY - 200, w: 130, h: 200, role: "pick", open: 0 })));
        room.w = Math.max(ROOM_W, 780 + v.choices.length * 200 + 200);
        room.x1 = x0 + room.w;
        break;
      }
      default:
        break;
    }
    return room;
  }

  buildRooms();
  s.npc.x = s.rooms[0].x0 + 640;
  s.npc.targetX = s.npc.x;

  // ── helpers ───────────────────────────────────────────────────────────
  const currentRoom = () => s.rooms[Math.min(s.beatIndex, s.rooms.length - 1)];
  const objects = () => currentRoom().objects;
  // ids repeat across beats (opt0, u0 …) — always look in the active room only
  const findObj = id => currentRoom().objects.find(o => o.id === id);

  function tween(target, props, dur, { easing = ease, onDone = null, delay = 0 } = {}) {
    const from = {};
    for (const k of Object.keys(props)) from[k] = target[k] ?? 0;
    s.tweens.push({ target, props, from, dur: s.reducedMotion ? 0.01 : dur, t: -delay, easing, onDone });
  }

  function puff(x, y, n = 6, kind = "dust") {
    if (s.reducedMotion) return;
    for (let i = 0; i < n; i += 1) {
      s.particles.push({ kind, x, y, vx: (rng.next() - 0.5) * 140, vy: -40 - rng.next() * 120, life: 0.5 + rng.next() * 0.4, age: 0, r: 5 + rng.next() * 8 });
    }
  }

  function seedLights(x, y, tx, ty, n = 10) {
    for (let i = 0; i < n; i += 1) {
      s.particles.push({ kind: "seed", x, y, tx, ty, t: 0, dur: 0.7 + rng.next() * 0.5, curve: (rng.next() - 0.5) * 300, r: 6 + rng.next() * 6, delay: i * 0.05 });
    }
  }

  function say(text, seconds = 3.2) {
    s.npc.bubble = text;
    s.npc.bubbleT = seconds;
  }

  function moveNpcTo(x, facing = -1) {
    s.npc.targetX = x;
    s.npc.facing = facing;
  }

  function heroCelebrate(seconds = 1.1) { s.hero.celebrateT = seconds; }

  function inReach(o) {
    const cx = o.x + (o.w || 0) / 2;
    const cy = o.y + (o.h || 0);
    return Math.abs(cx - s.hero.x) < REACH + (o.w || 0) / 2 && cy > s.hero.y - HERO_H - 260 && cy < s.hero.y + 200;
  }

  // ── room / beat lifecycle ───────────────────────────────────────────────
  function npcSpot(room) {
    switch (room.kind) {
      case MECHANICS.WORD_FORGE: return room.x0 + 60;
      case MECHANICS.BLEND_BRIDGE: return room.x0 + 200;
      case MECHANICS.HEART_LANTERN: return room.x0 + 940;
      case MECHANICS.GATE_RIDDLE: return room.x0 + 60;
      case MECHANICS.STORY_BRIDGE: return room.x0 + 60;
      case MECHANICS.SOUND_SORT: return room.x0 + 60;
      case MECHANICS.ECHO_HUNT: return room.x0 + 60;
      default: return room.x0 + Math.min(room.w - 200, 640);
    }
  }

  function enterBeat(index) {
    s.beatIndex = index;
    const room = currentRoom();
    if (room.kind === "finale") { startFinale(); return; }
    moveNpcTo(npcSpot(room), 1);
    s.npc.anim = "talk";
    const beat = room.beat;
    if (beat.mechanic === MECHANICS.SOUND_SORT) showSortItem(room, 0);
    if (beat.mechanic === MECHANICS.STORY_BRIDGE) say("Read my note!", 2.5);
  }

  function showSortItem(room, itemIndex) {
    const item = room.objects.find(o => o.kind === "item");
    item.itemIndex = itemIndex;
    item.visible = itemIndex < room.beat.view.items.length;
    item.x = room.x0 + 540;
    item.y = GY - 380;
    item.scale = 0;
    tween(item, { scale: 1 }, 0.35, { easing: easeBack });
  }

  function startFinale() {
    s.complete = true;
    s.finale = { t: 0 };
    const room = currentRoom();
    moveNpcTo(room.x0 + 520, -1);
    s.npc.anim = "celebrate";
    heroCelebrate(3);
    say(stop.fix, 5);
    if (!s.reducedMotion) {
      for (let i = 0; i < 40; i += 1) {
        s.particles.push({ kind: "confetti", x: room.x0 + 200 + rng.next() * 500, y: GY - 500 - rng.next() * 200, vx: (rng.next() - 0.5) * 80, vy: 40 + rng.next() * 80, life: 4 + rng.next() * 2, age: 0, r: 6 + rng.next() * 6, hue: rng.int(360), spin: rng.next() * 6 });
      }
    }
    fx?.fanfare?.();
  }

  function markRoomDone(room) {
    room.done = true;
    tween(room, { fenceOpen: 1 }, 0.5);
    s.npc.anim = "celebrate";
    setTimeout(() => { if (s.npc.anim === "celebrate") s.npc.anim = "talk"; }, 1400);
  }

  // ── outcomes from the authority ──────────────────────────────────────────
  function applyOutcome(action, outcome, beatState) {
    const room = currentRoom();
    const beat = room.beat;
    if (!beat) return;
    s.beatStates[s.beatIndex] = beatState;
    switch (beat.mechanic) {
      case MECHANICS.SIGNPOST: {
        if (action.type === "HEARD_CARD") {
          const o = room.objects.find(x => x.id === `card:${action.targetId}`);
          if (o) { o.heard = true; o.glow = 1; tween(o, { glow: 0 }, 0.8); sparkleAt(o.x + o.w / 2, o.y + 40); }
        }
        if (outcome.type === "complete") markRoomDone(room);
        if (outcome.type === "blocked") say(outcome.line, 2.2);
        break;
      }
      case MECHANICS.ECHO_HUNT: {
        const o = room.objects.find(x => x.id === (outcome.chosenId || action.optionId));
        if (outcome.type === "correct") {
          if (o) { o.state = "open"; o.glow = 1; tween(o, { glow: 0, scale: 1.08 }, 0.5); }
          const lm = room.landmark;
          seedLights(o ? o.x + 60 : s.hero.x, o ? o.y + 60 : s.hero.y - 80, lm.x + 20, GY - 250, 12);
          tween(lm, { lit: 1 }, 0.9, { delay: 0.5 });
          heroCelebrate();
          say("That's it. /" + beat.view.target.soundLabel.replace(/\//g, "") + "/ — " + (o?.option?.grapheme || "") + ".", 2.6);
          fx?.chime?.();
          markRoomDone(room);
        } else if (outcome.type === "incorrect") {
          if (o) { o.wobble = 1; tween(o, { wobble: 0 }, 0.5); }
          say(outcome.line, 3.4);
          s.npc.anim = "think";
          fx?.wobble?.();
          if (outcome.revealId) revealObject(room, outcome.revealId);
        } else if (outcome.type === "model") {
          say(outcome.line, 2.6);
          revealObject(room, outcome.revealId);
        }
        break;
      }
      case MECHANICS.SOUND_SORT: {
        const item = room.objects.find(x => x.kind === "item");
        const bin = room.objects.find(x => x.id === (outcome.binId || action.binId));
        if (outcome.type === "correct" || outcome.type === "complete") {
          if (item && bin) {
            tween(item, { x: bin.x + bin.w / 2 - item.w / 2, y: bin.y - 40, scale: 0.4 }, 0.45, { easing: easeOut, onDone: () => { bin.fill += 1; bin.glow = 1; tween(bin, { glow: 0 }, 0.6); puff(bin.x + bin.w / 2, bin.y + 20, 5); if (outcome.type === "correct") showSortItem(room, beatState.itemIndex); else item.visible = false; } });
          }
          fx?.pop?.();
          say(outcome.type === "complete" ? "All sorted!" : "Yes — into the basket.", 1.8);
          if (outcome.type === "complete") { heroCelebrate(); markRoomDone(room); }
        } else if (outcome.type === "incorrect") {
          if (bin) { bin.wobble = 1; tween(bin, { wobble: 0 }, 0.5); }
          say(outcome.line, 3.4);
          s.npc.anim = "think";
          fx?.wobble?.();
          if (outcome.revealId) revealObject(room, outcome.revealId);
        } else if (outcome.type === "model") {
          say(outcome.line, 2.6);
          revealObject(room, outcome.revealId);
        }
        break;
      }
      case MECHANICS.WORD_FORGE: {
        const tileObj = room.objects.find(x => x.id === action.tileId);
        if (outcome.type === "progress" || outcome.type === "complete") {
          if (tileObj) {
            const slotX = room.bridgeX + 4 + outcome.slot * ((room.bridgeW - 8) / beat.view.slots) + 6;
            tileObj.placed = true;
            tween(tileObj, { x: slotX, y: GY - 30, scale: 1 }, 0.5, { easing: easeOut, onDone: () => { puff(slotX + 40, GY - 20, 5); fx?.land?.(); tileObj.hidden = true; } });
          }
          if (outcome.type === "complete") {
            fx?.chime?.();
            heroCelebrate();
            say(`${beat.view.word}! The bridge is built.`, 2.6);
            markRoomDone(room);
          } else fx?.pop?.();
        } else if (outcome.type === "incorrect") {
          if (tileObj) {
            tween(tileObj, { x: tileObj.home.x, y: tileObj.home.y - 60 }, 0.25, { easing: easeOut, onDone: () => tween(tileObj, { y: tileObj.home.y }, 0.25) });
            tileObj.wobble = 1; tween(tileObj, { wobble: 0 }, 0.5);
          }
          say(outcome.line, 3.2);
          s.npc.anim = "think";
          fx?.wobble?.();
          if (outcome.revealId) revealObject(room, outcome.revealId);
        } else if (outcome.type === "model") {
          say(outcome.line, 2.6);
          revealObject(room, outcome.revealId);
        } else if (outcome.type === "removed") {
          const last = room.objects.filter(x => x.kind === "tile" && x.placed).pop();
          if (last) { last.placed = false; last.hidden = false; tween(last, { x: last.home.x, y: last.home.y }, 0.35); }
        }
        break;
      }
      case MECHANICS.BLEND_BRIDGE: {
        if (outcome.type === "progress") {
          const st = room.objects.find(x => x.id === action.stoneId);
          if (st) { st.lit = true; st.glow = 1; tween(st, { glow: 0.4 }, 0.6); sparkleAt(st.x + st.w / 2, st.y); }
          fx?.tick?.();
          if (outcome.ready) say("Now blend them!", 2.4);
        } else if (outcome.type === "nudge") {
          say(outcome.line, 2.2);
          fx?.wobble?.();
        } else if (outcome.type === "revealed") {
          // stones stay tappable to re-hear a sound, but the decision is now the sign
          room.objects.filter(x => x.kind === "stone").forEach(st => { st.role = "hear"; });
          const bw = room.objects.find(x => x.kind === "blendword");
          bw.visible = true; bw.text = outcome.word; bw.scale = 0; tween(bw, { scale: 1 }, 0.45, { easing: easeBack });
          room.objects.filter(x => x.kind === "stone").forEach(st => { st.glow = 1; tween(st, { glow: 0.3 }, 1.2); });
          room.objects.filter(x => x.kind === "optionSign").forEach((o, i) => { o.visible = true; o.scale = 0; tween(o, { scale: 1 }, 0.4, { easing: easeBack, delay: 0.3 + i * 0.1 }); });
          fx?.chime?.();
          say(beat.view.mode === "picture" ? `${outcome.word}. Which picture is it?` : `${outcome.word}. Which sign says it?`, 3);
        } else if (outcome.type === "correct") {
          const o = room.objects.find(x => x.id === action.optionId);
          if (o) { o.glow = 1; tween(o, { glow: 0, scale: 1.1 }, 0.5); }
          heroCelebrate();
          fx?.chime?.();
          say("Yes! You read it.", 2.4);
          markRoomDone(room);
        } else if (outcome.type === "incorrect") {
          const o = room.objects.find(x => x.id === outcome.chosenId);
          if (o) { o.wobble = 1; tween(o, { wobble: 0 }, 0.5); }
          say(outcome.line, 3.2);
          s.npc.anim = "think";
          fx?.wobble?.();
          if (outcome.revealId) revealObject(room, outcome.revealId);
        } else if (outcome.type === "model") {
          say(outcome.line, 2.6);
          revealObject(room, outcome.revealId);
        }
        break;
      }
      case MECHANICS.HEART_LANTERN: {
        const big = room.objects.find(x => x.kind === "bigLantern");
        if (action.type === "HEARD" && big) { big.glow = 1; tween(big, { glow: 0 }, 0.8); sparkleAt(big.x + big.w / 2, big.y + 40); }
        if (outcome.type === "phase" && outcome.phase === "find") {
          room.objects.filter(x => x.kind === "wordLantern").forEach((o, i) => { o.visible = true; o.scale = 0; tween(o, { scale: 1 }, 0.4, { easing: easeBack, delay: i * 0.1 }); });
          say(`Find ${beat.view.word}.`, 2.6);
        } else if (outcome.type === "blocked") {
          say(outcome.line, 2.2);
        } else if (outcome.type === "correct" || outcome.type === "complete") {
          const o = room.objects.find(x => x.id === action.optionId);
          if (o) { o.lit = true; o.glow = 1; tween(o, { glow: 0.5 }, 0.6); }
          room.objects.filter(x => x.kind === "wordLantern" && x.id !== action.optionId).forEach(x => tween(x, { alpha: 0.35 }, 0.4));
          fx?.chime?.();
          heroCelebrate();
          if (outcome.type === "correct") {
            if (big) { big.phrase = true; big.scale = 0.7; tween(big, { scale: 1 }, 0.45, { easing: easeBack, delay: 0.3 }); big.glow = 1; tween(big, { glow: 0 }, 1); }
            say("Read it with me.", 2.4);
          } else {
            say(`${beat.view.word}! The lantern tree glows.`, 2.4);
            markRoomDone(room);
          }
        } else if (outcome.type === "incorrect") {
          const o = room.objects.find(x => x.id === outcome.chosenId);
          if (o) { o.wobble = 1; tween(o, { wobble: 0 }, 0.5); }
          say(outcome.line, 3.2);
          s.npc.anim = "think";
          fx?.wobble?.();
          if (outcome.revealId) revealObject(room, outcome.revealId);
        } else if (outcome.type === "model") {
          say(outcome.line, 2.6);
          revealObject(room, outcome.revealId);
        }
        if (action.type === "FINISH" && outcome.type === "complete") {
          say(`${beat.view.word}! The lantern tree glows.`, 2.4);
          markRoomDone(room);
        }
        break;
      }
      case MECHANICS.GATE_RIDDLE: {
        const k = room.objects.find(x => x.id === (outcome.chosenId || action.keyId));
        const g = room.objects.find(x => x.kind === "gate");
        if (outcome.type === "correct") {
          if (k) { k.turned = true; k.glow = 1; tween(k, { x: g.x + 50, y: g.y + 90 }, 0.5, { easing: easeOut, onDone: () => { tween(g, { open: 1 }, 0.8); puff(g.x + 100, GY, 8); } }); }
          fx?.chime?.();
          heroCelebrate();
          say("The key fits! The gate opens.", 2.6);
          markRoomDone(room);
        } else if (outcome.type === "incorrect") {
          if (k) { k.wobble = 1; tween(k, { wobble: 0 }, 0.5); k.selected = false; }
          say(outcome.line, 3.2);
          s.npc.anim = "think";
          fx?.wobble?.();
          if (outcome.revealId) revealObject(room, outcome.revealId);
        } else if (outcome.type === "model") {
          say(outcome.line, 2.6);
          revealObject(room, outcome.revealId);
        }
        break;
      }
      case MECHANICS.STORY_BRIDGE: {
        const d = room.objects.find(x => x.id === (outcome.chosenId || action.choiceId));
        if (outcome.type === "correct") {
          if (d) { d.glow = 1; tween(d, { open: 1, glow: 0 }, 0.7); }
          fx?.chime?.();
          heroCelebrate();
          say("That's the one!", 2.4);
          markRoomDone(room);
        } else if (outcome.type === "incorrect") {
          if (d) { d.wobble = 1; tween(d, { wobble: 0 }, 0.5); }
          say(outcome.line, 3.2);
          s.npc.anim = "think";
          fx?.wobble?.();
          if (outcome.revealId) revealObject(room, outcome.revealId);
        } else if (outcome.type === "model") {
          say(outcome.line, 2.6);
          revealObject(room, outcome.revealId);
        }
        break;
      }
      default:
        break;
    }
  }

  function revealObject(room, id) {
    const o = room.objects.find(x => x.id === id);
    if (!o) return;
    o.reveal = 1;
    // stand just left of the object, pointing at it, without covering its neighbours
    const others = room.objects.filter(x => x !== o && x.role === "pick" && !x.hidden && x.visible !== false);
    let nx = o.x - 110;
    if (others.some(x => Math.abs((x.x + (x.w || 0) / 2) - nx) < 90)) nx = o.x + (o.w || 0) + 110;
    moveNpcTo(Math.max(currentRoom().x0 + 60, nx), nx < o.x ? 1 : -1);
    s.npc.anim = "talk";
  }

  function sparkleAt(x, y) {
    if (s.reducedMotion) return;
    for (let i = 0; i < 8; i += 1) {
      s.particles.push({ kind: "spark", x: x + (rng.next() - 0.5) * 60, y: y + (rng.next() - 0.5) * 40, vx: (rng.next() - 0.5) * 60, vy: -30 - rng.next() * 60, life: 0.6 + rng.next() * 0.4, age: 0, r: 5 + rng.next() * 6 });
    }
  }

  // ── input → actions ───────────────────────────────────────────────────────
  function activate(o) {
    const room = currentRoom();
    const beat = room.beat;
    if (!beat || room.done || o.hidden) return;
    s.hero.facing = o.x + (o.w || 0) / 2 >= s.hero.x ? 1 : -1;
    switch (o.kind) {
      case "signpost": {
        onHear?.([o.card.phonemeAudio, o.card.anchorAudio].filter(Boolean), { kind: "teach", targetId: o.card.targetId });
        onAction({ type: "HEARD_CARD", targetId: o.card.targetId });
        break;
      }
      case "crate":
        onHear?.([o.option.audio], { kind: "option" });
        onAction({ type: "CHOOSE", optionId: o.id });
        break;
      case "basket": {
        const item = room.objects.find(x => x.kind === "item");
        const current = beat.view.items[item?.itemIndex ?? 0];
        if (!current || !item?.visible) return;
        onAction({ type: "PLACE", itemId: current.id, binId: o.id });
        break;
      }
      case "item": {
        const current = beat.view.items[o.itemIndex];
        if (current) { onHear?.([current.audio], { kind: "item" }); o.glow = 1; tween(o, { glow: 0 }, 0.6); }
        break;
      }
      case "tile":
        if (o.placed) return;
        onHear?.([o.tile.audio], { kind: "tile" });
        onAction({ type: "PLACE_TILE", tileId: o.id });
        break;
      case "wordframe":
        onHear?.([beat.view.wordAudio], { kind: "word" });
        o.glow = 1; tween(o, { glow: 0 }, 0.6);
        break;
      case "stone":
        onHear?.([o.stone.audio], { kind: "stone" });
        onAction({ type: "TAP_STONE", stoneId: o.id });
        break;
      case "optionSign":
        if (!o.visible) return;
        if (o.option.audio) onHear?.([o.option.audio], { kind: "option" });
        onAction({ type: "CHOOSE", optionId: o.id });
        break;
      case "bigLantern":
        if (o.phrase) { onHear?.(beat.view.phrase.words.map(w => w.audio), { kind: "phrase" }); break; }
        onHear?.([beat.view.wordAudio], { kind: "word" });
        onAction({ type: "HEARD" });
        break;
      case "wordLantern":
        if (!o.visible) return;
        onHear?.([o.option.audio], { kind: "option" });
        onAction({ type: "CHOOSE", optionId: o.id });
        break;
      case "key":
        if (!o.heard) {
          o.heard = true; o.selected = true; o.glow = 1; tween(o, { glow: 0.5 }, 0.5);
          room.objects.filter(x => x.kind === "key" && x !== o).forEach(x => { x.selected = false; });
          onHear?.([o.keyOption.audio], { kind: "key" });
          say("Tap it again to try the key.", 2);
        } else {
          onAction({ type: "CHOOSE", keyId: o.id });
        }
        break;
      case "ruleboard":
        onHear?.(beat.prompt.cues.map(c => c.src), { kind: "rule" });
        break;
      case "board":
        onHear?.(beat.view.words.map(w => w.audio), { kind: "line", onWord: i => { o.highlight = i; }, onDone: () => { o.highlight = -1; } });
        break;
      case "door":
        onAction({ type: "CHOOSE", choiceId: o.id });
        break;
      default:
        break;
    }
  }

  function pickNearest() {
    const cands = objects().filter(o => o.role !== "none" && !o.hidden && o.visible !== false && inReach(o));
    if (!cands.length) return false;
    cands.sort((a, b) => Math.abs(a.x + a.w / 2 - s.hero.x) - Math.abs(b.x + b.w / 2 - s.hero.x));
    activate(cands[0]);
    return true;
  }

  function pickNth(n) {
    const room = currentRoom();
    const picks = room.objects.filter(o => o.role === "pick" && !o.hidden && o.visible !== false && !o.placed);
    const o = picks[n];
    if (!o) return false;
    walkThenActivate(o);
    return true;
  }

  function walkThenActivate(o) {
    if (inReach(o)) { activate(o); return; }
    const standOff = o.kind === "tile" ? 75 : 90;
    s.hero.walkTo = o.x + (o.w || 0) / 2 - (o.x + (o.w || 0) / 2 > s.hero.x ? standOff : -standOff);
    s.hero.walkThen = () => activate(o);
  }

  function screenToWorld(sx, sy) {
    return { x: sx / s.view.scale + s.camX, y: sy / s.view.scale };
  }

  function hitObject(wx, wy) {
    const room = currentRoom();
    let best = null;
    for (const o of room.objects) {
      if (o.role === "none" || o.hidden || o.visible === false) continue;
      const pad = 14;
      if (wx >= o.x - pad && wx <= o.x + (o.w || 60) + pad && wy >= o.y - pad && wy <= o.y + (o.h || 60) + pad) {
        best = o;
      }
    }
    return best;
  }

  function pointerDown(sx, sy) {
    const { x, y } = screenToWorld(sx, sy);
    const o = hitObject(x, y);
    if (o) { walkThenActivate(o); return "object"; }
    // tap on the ground: walk there
    if (y > GY - 320) {
      s.hero.walkTo = Math.max(currentRoomMinX() + 40, Math.min(currentRoomMaxX() - 40, x));
      s.hero.walkThen = null;
      return "walk";
    }
    return null;
  }

  function currentRoomMinX() { return 60; }
  function currentRoomMaxX() {
    const room = currentRoom();
    if (room.kind === "finale") return room.x1 - 60;
    return room.done ? s.rooms[Math.min(s.beatIndex + 1, s.rooms.length - 1)].x1 - 60 : room.x1 - 40;
  }

  function setInput(name, value) {
    if (name === "jump" && value && !s.input.jump) s.hero.buffer = 0.12;
    s.input[name] = Boolean(value);
    if ((name === "left" || name === "right") && value) { s.hero.walkTo = null; s.hero.walkThen = null; }
  }

  function key(code, down) {
    if (code === "ArrowLeft" || code === "KeyA") { setInput("left", down); return true; }
    if (code === "ArrowRight" || code === "KeyD") { setInput("right", down); return true; }
    if (code === "ArrowUp" || code === "Space" || code === "KeyW") { setInput("jump", down); return true; }
    if (!down) return false;
    if (code === "Enter" || code === "KeyE") return pickNearest();
    if (/^Digit[1-9]$/.test(code)) return pickNth(Number(code.slice(5)) - 1);
    return false;
  }

  // ── simulation ─────────────────────────────────────────────────────────
  function physics() {
    const h = s.hero;
    const room = currentRoom();
    // auto-walk
    if (h.walkTo != null) {
      const dx = h.walkTo - h.x;
      if (Math.abs(dx) < 6) {
        h.x = h.walkTo; h.walkTo = null; h.vx = 0;
        const then = h.walkThen; h.walkThen = null;
        if (then) then();
      } else {
        h.vx = Math.sign(dx) * MOVE * (Math.abs(dx) > 220 ? 1.9 : 1.25);
        h.facing = Math.sign(dx);
        // hop up small ledges automatically
        if (h.onGround && needsHop(h, Math.sign(dx))) { h.vy = -JUMP * 0.85; h.onGround = false; fx?.jump?.(); }
      }
    } else {
      const dir = (s.input.right ? 1 : 0) - (s.input.left ? 1 : 0);
      h.vx = dir * MOVE;
      if (dir) h.facing = dir;
    }
    // jump: coyote + buffer + variable height
    if (h.onGround) h.coyote = 0.1; else h.coyote = Math.max(0, h.coyote - STEP);
    h.buffer = Math.max(0, h.buffer - STEP);
    if (h.buffer > 0 && h.coyote > 0) {
      h.vy = -JUMP; h.onGround = false; h.buffer = 0; h.coyote = 0; h.jumpHeld = true;
      puff(h.x, h.y, 4);
      fx?.jump?.();
    }
    if (!s.input.jump && h.jumpHeld && h.vy < -4) { h.vy = -4; h.jumpHeld = false; }
    if (!s.input.jump) h.jumpHeld = false;
    h.vy += GRAV;
    if (h.vy > 18) h.vy = 18;
    // integrate x
    h.x += h.vx;
    const minX = currentRoomMinX();
    const maxX = currentRoomMaxX();
    if (h.x < minX) h.x = minX;
    if (h.x > maxX) { h.x = maxX; if (h.walkTo != null && h.walkTo > maxX) { h.walkTo = null; } }
    // integrate y with one-way platforms + ground
    const prevY = h.y;
    h.y += h.vy;
    let landed = false;
    const plats = s.rooms.flatMap(r => r.platforms);
    if (h.vy >= 0) {
      for (const p of plats) {
        if (h.x + HERO_W / 2 > p.x && h.x - HERO_W / 2 < p.x + p.w && prevY <= p.y + 2 && h.y >= p.y) {
          h.y = p.y; landed = true;
        }
      }
      if (!overWater(h.x) && h.y >= GY) { h.y = GY; landed = true; }
      if (overWater(h.x) && h.y >= GY + 30) { h.y = GY + 30; landed = true; }
    }
    if (landed) {
      if (!h.onGround) { squashPuppet(h.puppet, Math.min(1, Math.abs(h.vy) / 14)); puff(h.x, h.y, 5); fx?.land?.(); }
      h.onGround = true; h.vy = 0;
    } else h.onGround = false;
    // animation state
    h.anim = h.celebrateT > 0 ? "celebrate" : !h.onGround ? (h.vy < 0 ? "jump" : "fall") : Math.abs(h.vx) > 0.5 ? "walk" : "idle";
    // camera range: current room (plus next when done)
    const roomStart = room.x0;
    const roomEnd = room.done && s.rooms[s.beatIndex + 1] ? s.rooms[s.beatIndex + 1].x1 : room.x1;
    const vw = s.view.w / s.view.scale;
    const target = h.x - vw * 0.45 + h.facing * 40;
    s.camTarget = Math.max(Math.min(roomStart, s.levelW - vw), Math.min(roomEnd - vw, target, s.levelW - vw));
    s.camTarget = Math.max(0, s.camTarget);
    // enter the next room when the hero crosses into it
    const next = s.rooms[s.beatIndex + 1];
    if (room.done && next && h.x > next.x0 + 80) enterBeat(s.beatIndex + 1);
  }

  function overWater(x) {
    const room = currentRoom();
    const w = room.water;
    if (!w) return false;
    if (room.kind === MECHANICS.WORD_FORGE) {
      // the bridge is walkable once complete
      if (room.done) return false;
    }
    return x > w.x + 10 && x < w.x + w.w - 10;
  }

  function needsHop(h, dir) {
    const plats = currentRoom().platforms;
    return plats.some(p => h.y <= GY && p.y < h.y - 20 && p.y > h.y - 260 && ((dir > 0 && p.x > h.x && p.x - h.x < 90) || (dir < 0 && p.x + p.w < h.x && h.x - (p.x + p.w) < 90)));
  }

  function update(dt) {
    s.t += dt;
    s.acc += Math.min(dt, 0.1);
    while (s.acc >= STEP) { physics(); s.acc -= STEP; }
    tickPuppet(s.hero.puppet, dt);
    tickPuppet(s.npc.puppet, dt);
    if (s.hero.celebrateT > 0) s.hero.celebrateT -= dt;
    // the character never lets the hero stand in front of it: when the hero
    // settles within a body width, it steps aside (away from the room edge)
    if (Math.abs(s.hero.x - s.npc.x) < 120 && Math.abs(s.npc.targetX - s.npc.x) <= 4 && s.hero.walkTo == null && Math.abs(s.hero.vx) < 0.5) {
      const room = currentRoom();
      const side = s.hero.x < (room.x0 + room.x1) / 2 ? -1 : 1; // towards the nearer edge, away from the puzzle
      let t = Math.max(room.x0 + 40, Math.min(room.x1 - 80, s.hero.x + side * 170));
      if (Math.abs(t - s.hero.x) < 120) t = s.hero.x - side * 170;
      s.npc.targetX = t;
    }
    // npc walks to its target
    const ndx = s.npc.targetX - s.npc.x;
    if (Math.abs(ndx) > 4) { s.npc.x += Math.sign(ndx) * Math.min(Math.abs(ndx), 260 * dt); s.npc.walking = true; s.npc.facing = Math.sign(ndx); }
    else { s.npc.walking = false; if (!s.npc.pointAt) s.npc.facing = s.hero.x >= s.npc.x ? 1 : -1; }
    if (s.npc.bubbleT > 0) { s.npc.bubbleT -= dt; if (s.npc.bubbleT <= 0) s.npc.bubble = null; }
    // camera
    const k = s.reducedMotion ? 1 : Math.min(1, dt * 5);
    s.camX += (s.camTarget - s.camX) * k;
    // tweens
    for (const tw of s.tweens) {
      tw.t += dt;
      if (tw.t < 0) continue;
      const p = Math.min(1, tw.t / tw.dur);
      const e = tw.easing(p);
      for (const kk of Object.keys(tw.props)) tw.target[kk] = tw.from[kk] + (tw.props[kk] - tw.from[kk]) * e;
      if (p >= 1) { tw.done = true; tw.onDone?.(); }
    }
    s.tweens = s.tweens.filter(tw => !tw.done);
    // particles
    for (const p of s.particles) {
      if (p.kind === "seed") { p.t += dt; continue; }
      p.age += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === "dust") p.vy += 60 * dt;
      if (p.kind === "confetti") { p.vx += Math.sin(s.t * 3 + p.hue) * 20 * dt; }
    }
    s.particles = s.particles.filter(p => (p.kind === "seed" ? p.t < p.dur + p.delay : p.age < p.life));
    for (const c of s.clouds) { c.x += c.v * dt; if (c.x > s.levelW * 0.35 + 800) c.x = -300; }
    if (s.finale) s.finale.t += dt;
  }

  // ── drawing ─────────────────────────────────────────────────────────────
  function drawBackdrop(ctx) {
    const { w, scale } = s.view;
    const img = getImage(BACKDROPS[stop.backdrop]);
    const vw = w / scale;
    ctx.save();
    ctx.scale(scale, scale);
    if (img) {
      const ih = DESIGN_H * 1.08;
      const iw = ih * (img.naturalWidth / img.naturalHeight);
      const px = -((s.camX * 0.22) % iw);
      for (let x = px - iw; x < vw + iw; x += iw) ctx.drawImage(img, x, -DESIGN_H * 0.08, iw, ih);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, DESIGN_H);
      g.addColorStop(0, PALETTE["room-sky-top"]); g.addColorStop(1, PALETTE["room-sky-bottom"]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, vw, DESIGN_H);
    }
    // clouds (parallax .35)
    for (const c of s.clouds) {
      const cx = c.x - s.camX * 0.35;
      if (cx > -300 && cx < vw + 300) cloud(ctx, cx, c.y, c.w);
    }
    // mid hills + bushes (parallax .55)
    ctx.save();
    ctx.translate(-s.camX * 0.5, 0);
    ctx.globalAlpha = 0.28;
    const hillStart = Math.floor(s.camX * 0.5 / 1100) * 1100 - 1100;
    for (let x = hillStart; x < s.camX * 0.5 + vw + 1100; x += 1100) {
      hill(ctx, x, GY - 40, 760, 150, pal.top);
      hill(ctx, x + 520, GY - 40, 620, 110, pal.top);
    }
    ctx.restore();
    ctx.save();
    ctx.translate(-s.camX * 0.75, 0);
    const bStart = Math.floor(s.camX * 0.75 / 520) * 520 - 520;
    for (let x = bStart; x < s.camX * 0.75 + vw + 520; x += 520) {
      bush(ctx, x + 40, GY - 118, 260, 130, LEAF, LEAF_DEEP);
      bush(ctx, x + 330, GY - 96, 180, 100, PALETTE["leaf-bright"], LEAF_DEEP);
    }
    ctx.restore();
    ctx.restore();
  }

  function drawWorld(ctx) {
    const { scale } = s.view;
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-s.camX, 0);
    const vw = s.view.w / scale;
    const camL = s.camX - 100;
    const camR = s.camX + vw + 100;
    // ground with water gaps
    let gx = 0;
    for (const room of s.rooms) {
      if (room.water) {
        ground(ctx, gx, GY, room.water.x - gx, DESIGN_H - GY, pal);
        water(ctx, room.water.x, GY + 22, room.water.w, DESIGN_H - GY - 22, s.t);
        gx = room.water.x + room.water.w;
      }
    }
    ground(ctx, gx, GY, s.levelW - gx + 400, DESIGN_H - GY, pal);
    // platforms first, then the character behind the puzzle objects
    for (const room of s.rooms) {
      if (room.x1 < camL || room.x0 > camR) continue;
      for (const p of room.platforms) {
        if (p.stone) continue; // drawn as stones
        platform(ctx, p.x, p.y, p.w, p.h, pal);
      }
    }
    drawNpc(ctx);
    const here = currentRoom();
    for (const room of s.rooms) {
      if (room.x1 < camL || room.x0 > camR) continue;
      // rooms beyond the next fence stay empty until that fence drops, so a
      // sliver of the next puzzle never shows at the edge of the screen
      const ahead = room.beatIndex > here.beatIndex;
      if (ahead && !here.done) { if (room.kind !== "finale") drawFence(ctx, room); continue; }
      if (ahead) { ctx.save(); ctx.globalAlpha = here.fenceOpen; drawRoom(ctx, room); ctx.restore(); }
      else drawRoom(ctx, room);
      // fence between rooms (drops when done)
      if (room.kind !== "finale") drawFence(ctx, room);
    }
    // seed particles + effects
    drawParticles(ctx);
    drawHero(ctx);
    drawBubble(ctx);
    ctx.restore();
  }

  function drawFence(ctx, room) {
    const x = room.x1 - 14;
    const drop = room.fenceOpen * 200;
    ctx.save();
    ctx.globalAlpha = 1 - room.fenceOpen;
    for (let i = 0; i < 3; i += 1) {
      roundRect(ctx, x + i * 12 - 12, GY - 150 + drop + i * 8, 10, 150 - i * 8, 4);
      inkFill(ctx, WOOD_DEEP, 3);
    }
    roundRect(ctx, x - 30, GY - 120 + drop, 60, 12, 4);
    inkFill(ctx, WOOD, 3);
    roundRect(ctx, x - 30, GY - 70 + drop, 60, 12, 4);
    inkFill(ctx, WOOD, 3);
    ctx.restore();
  }

  function withTransform(ctx, o, draw) {
    ctx.save();
    const cx = o.x + (o.w || 0) / 2;
    const cy = o.y + (o.h || 0);
    ctx.translate(cx, cy);
    ctx.rotate((o.rot || 0) + (o.wobble ? Math.sin(s.t * 40) * 0.1 * o.wobble : 0));
    ctx.scale(o.scale ?? 1, o.scale ?? 1);
    ctx.translate(-cx, -cy);
    ctx.globalAlpha = o.alpha ?? 1;
    draw();
    ctx.restore();
  }

  function revealGlow(o) {
    return o.reveal ? 0.5 + 0.5 * Math.sin(s.t * 6) : 0;
  }

  function drawRoom(ctx, room) {
    const beat = room.beat;
    if (room.kind === "finale") { drawFinale(ctx, room); return; }
    // room title plate (what to do) is in the HUD; the world shows the puzzle
    for (const o of room.objects) {
      if (o.hidden || o.visible === false) continue;
      switch (o.kind) {
        case "signpost":
          withTransform(ctx, o, () => {
            signpost(ctx, o.x, o.y, o.w, o.h, o.card.grapheme, { glow: Math.max(o.glow, o.heard ? 0 : 0.25 + 0.25 * Math.sin(s.t * 3)), sub: o.card.kind === "alt" ? `in ${o.card.anchorWord}` : "" });
            const anchorImg = o.card.anchorImage ? getImage(o.card.anchorImage) : null;
            if (anchorImg) {
              frame(ctx, o.x + 30, o.y - 200, 160, 150);
              ctx.drawImage(anchorImg, o.x + 34, o.y - 196, 152, 142);
              label(ctx, o.card.anchorWord, o.x + 110, o.y - 26, { size: 22, font: FONT_DISPLAY, color: WOOD_DEEP });
            } else if (o.card.anchorWord) {
              frame(ctx, o.x + 30, o.y - 120, 160, 80);
              label(ctx, o.card.anchorWord, o.x + 110, o.y - 80, { size: 30 });
            }
            if (o.heard) sparkle(ctx, o.x + o.w - 18, o.y - 10, 12, 0.9);
          });
          break;
        case "crate":
          withTransform(ctx, o, () => crate(ctx, o.x, o.y, o.w, o.option.grapheme, { state: o.state || "idle", glow: Math.max(o.glow, revealGlow(o)) }));
          break;
        case "basket":
          withTransform(ctx, o, () => basket(ctx, o.x, o.y, o.w, o.h, o.bin.grapheme, { fill: o.fill, glow: Math.max(o.glow, revealGlow(o)), sub: o.bin.anchorWord || o.bin.soundLabel }));
          break;
        case "item": {
          const item = beat.view.items[o.itemIndex];
          if (!item) break;
          withTransform(ctx, o, () => {
            const bob = s.reducedMotion ? 0 : Math.sin(s.t * 3) * 8;
            const img = item.image ? getImage(item.image) : null;
            frame(ctx, o.x, o.y + bob, o.w, o.h, { fill: CREAM });
            if (img) {
              ctx.drawImage(img, o.x + 8, o.y + 8 + bob, o.w - 16, o.h - 56);
              label(ctx, item.word, o.x + o.w / 2, o.y + o.h - 24 + bob, { size: 26 });
            } else {
              // no picture: the word alone, big and centred
              label(ctx, item.word, o.x + o.w / 2, o.y + o.h / 2 + bob, { size: 48, font: FONT_LETTER, maxWidth: o.w - 24 });
            }
            label(ctx, "◖))", o.x + o.w - 22, o.y + 18 + bob, { size: 16, font: FONT_DISPLAY, color: WOOD_DEEP });
            if (o.glow) sparkle(ctx, o.x + o.w / 2, o.y + bob - 10, 12, o.glow);
          });
          break;
        }
        case "stump":
          stump(ctx, o.x, o.y, o.w, o.h, pal);
          break;
        case "tile":
          withTransform(ctx, o, () => tile(ctx, o.x, o.y, o.w, o.h, o.tile.grapheme, { glow: Math.max(o.glow, revealGlow(o)), placed: o.placed }));
          break;
        case "wordframe": {
          const img = beat.view.image ? getImage(beat.view.image) : null;
          withTransform(ctx, o, () => {
            frame(ctx, o.x, o.y, o.w, o.h);
            if (img) ctx.drawImage(img, o.x + 8, o.y + 8, o.w - 16, o.h - 44);
            else label(ctx, "◖)) hear it", o.x + o.w / 2, o.y + o.h / 2 - 10, { size: 22, font: FONT_DISPLAY, color: WOOD_DEEP });
            label(ctx, "tap to hear", o.x + o.w / 2, o.y + o.h - 18, { size: 16, font: FONT_DISPLAY, color: WOOD_DEEP });
            if (o.glow) sparkle(ctx, o.x + o.w - 10, o.y, 12, o.glow);
          });
          break;
        }
        case "stone":
          withTransform(ctx, o, () => stone(ctx, o.x, o.y, o.w, o.h, o.stone.grapheme, { glow: o.glow, lit: o.lit }));
          break;
        case "blendword":
          withTransform(ctx, o, () => {
            roundRect(ctx, o.x, o.y, o.w, o.h, 26);
            inkFill(ctx, GOLD);
            label(ctx, o.text, o.x + o.w / 2, o.y + o.h / 2, { size: 64 });
          });
          break;
        case "optionSign": {
          withTransform(ctx, o, () => {
            roundRect(ctx, o.x + o.w / 2 - 10, o.y + 90, 20, o.h - 90, 6);
            inkFill(ctx, WOOD_DEEP);
            frame(ctx, o.x, o.y, o.w, 130, { fill: CREAM });
            if (o.option.image) {
              const img = getImage(o.option.image);
              if (img) ctx.drawImage(img, o.x + 8, o.y + 8, o.w - 16, 114);
            } else {
              label(ctx, o.option.word, o.x + o.w / 2, o.y + 65, { size: 40 });
            }
            const g = Math.max(o.glow, revealGlow(o));
            if (g) sparkle(ctx, o.x + o.w - 6, o.y - 4, 14, g);
          });
          break;
        }
        case "tree":
          drawTree(ctx, o);
          break;
        case "bigLantern":
          // hooked post behind the lantern
          roundRect(ctx, o.x + o.w + 10, o.y - 60, 24, GY - (o.y - 60), 8);
          inkFill(ctx, WOOD_DEEP);
          roundRect(ctx, o.x + o.w / 2 - 8, o.y - 66, o.w / 2 + 42, 18, 8);
          inkFill(ctx, WOOD_DEEP);
          ctx.beginPath(); ctx.moveTo(o.x + o.w / 2, o.y - 48); ctx.lineTo(o.x + o.w / 2, o.y); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
          withTransform(ctx, o, () => {
            lantern(ctx, o.x, o.y, o.w, { lit: true, hang: false, glow: 0.9 + o.glow });
            if (o.phrase) {
              // the found word inside its phrase, the heart word in berry
              drawPhrase(ctx, beat.view.phrase.words, beat.view.word, o.x + o.w / 2, o.y + o.h * 0.5, o.w - 44, 34);
              label(ctx, "◖)) tap to hear it read", o.x + o.w / 2, o.y + o.h - 30, { size: 15, font: FONT_DISPLAY, color: WOOD_DEEP });
              return;
            }
            // word with heart letters
            const letters = beat.view.letters;
            const cell = Math.min(60, (o.w - 50) / Math.max(2, letters.length));
            const size = cell * 1.05;
            const total = letters.length * cell;
            letters.forEach((ch, i) => {
              const lx = o.x + o.w / 2 - total / 2 + i * cell + cell / 2;
              const ly = o.y + o.h * 0.5;
              const heart = beat.view.heartLetterIndices.includes(i);
              if (heart) heartShape(ctx, lx, ly, cell * 0.46, PALETTE["heart-pale"]);
              label(ctx, ch, lx, ly, { size, color: heart ? BERRY : INK });
            });
            label(ctx, "◖)) tap to hear", o.x + o.w / 2, o.y + o.h + 22, { size: 16, font: FONT_DISPLAY, color: CREAM, stroke: INK, strokeWidth: 4 });
          });
          break;
        case "wordLantern":
          withTransform(ctx, o, () => lantern(ctx, o.x, o.y, o.w, { lit: o.lit, text: o.option.word, hang: true, glow: Math.max(o.glow, revealGlow(o)) }));
          break;
        case "hook":
          roundRect(ctx, o.x - 6, o.y - 60, 12, 60, 4);
          inkFill(ctx, WOOD_DEEP, 3);
          break;
        case "key":
          withTransform(ctx, o, () => keyProp(ctx, o.x, o.y, o.w, o.keyOption.word, { glow: Math.max(o.glow, revealGlow(o), o.selected ? 0.4 : 0), turned: o.turned }));
          break;
        case "gate":
          gate(ctx, o.x, o.y, o.w, o.h, { open: o.open, pal });
          break;
        case "ruleboard":
          withTransform(ctx, o, () => {
            roundRect(ctx, o.x + o.w / 2 - 12, o.y + o.h, 24, GY - (o.y + o.h), 6);
            inkFill(ctx, WOOD_DEEP);
            frame(ctx, o.x, o.y, o.w, o.h, { fill: CREAM });
            wrapText(ctx, beat.view.ruleText, o.x + o.w / 2, o.y + o.h / 2 - 6, o.w - 40, 30, { weight: 900 });
            label(ctx, "◖)) tap to hear the rule", o.x + o.w / 2, o.y + o.h - 16, { size: 15, font: FONT_DISPLAY, color: WOOD_DEEP });
          });
          break;
        case "board": {
          withTransform(ctx, o, () => {
            roundRect(ctx, o.x + 40, o.y + o.h, 20, GY - (o.y + o.h), 6);
            inkFill(ctx, WOOD_DEEP);
            roundRect(ctx, o.x + o.w - 60, o.y + o.h, 20, GY - (o.y + o.h), 6);
            inkFill(ctx, WOOD_DEEP);
            frame(ctx, o.x, o.y, o.w, o.h, { fill: CREAM });
            // words laid out with highlight
            ctx.font = `900 34px ${FONT_DISPLAY}`;
            const words = beat.view.words;
            const gap = 14;
            const widths = words.map(w => ctx.measureText(w.text).width);
            const lines = [];
            let line = []; let lw = 0;
            words.forEach((w, i) => {
              if (lw + widths[i] > o.w - 60 && line.length) { lines.push(line); line = []; lw = 0; }
              line.push(i); lw += widths[i] + gap;
            });
            if (line.length) lines.push(line);
            const lh = 48;
            const y0 = o.y + o.h / 2 - ((lines.length - 1) * lh) / 2 - 8;
            lines.forEach((ln, li) => {
              const total = ln.reduce((a, i) => a + widths[i] + gap, -gap);
              let x = o.x + o.w / 2 - total / 2;
              for (const i of ln) {
                if (o.highlight === i) {
                  roundRect(ctx, x - 6, y0 + li * lh - 22, widths[i] + 12, 44, 10);
                  ctx.fillStyle = GOLD; ctx.fill();
                }
                label(ctx, words[i].text, x + widths[i] / 2, y0 + li * lh, { size: 34, font: FONT_DISPLAY, weight: 900 });
                x += widths[i] + gap;
              }
            });
            label(ctx, "◖)) tap to hear it read", o.x + o.w / 2, o.y + o.h - 16, { size: 15, font: FONT_DISPLAY, color: WOOD_DEEP });
          });
          break;
        }
        case "door":
          withTransform(ctx, o, () => door(ctx, o.x, o.y, o.w, o.h, o.choice.label, { icon: iconFor(o.choice.icon), glow: Math.max(o.glow, revealGlow(o)), open: o.open }));
          break;
        default:
          break;
      }
    }
    if (room.landmark) drawLandmark(ctx, room.landmark);
    if (room.kind === MECHANICS.WORD_FORGE) {
      const placed = s.beatStates[room.beatIndex]?.placed || [];
      const planks = Array.from({ length: beat.view.slots }, (_, i) => ({ filled: i < placed.length, text: placed[i] ? beat.view.tiles.find(t => t.id === placed[i])?.grapheme : "", active: i === placed.length }));
      bridge(ctx, room.bridgeX, GY - 34, room.bridgeW, 58, planks, { pal });
    }
  }

  function iconFor(icon) {
    const map = { sit: "🪑", run: "🏃", hop: "🐇", sleep: "💤", up: "⬆️", mat: "🧺", jam: "🍯", box: "📦", hug: "🤗", shush: "🤫", sing: "🎵", hide: "🙈", pick: "✋", kick: "🦶", look: "🔍", swim: "🌊", clap: "👏", sad: "😢", pull: "🪨", smile: "😊", fly: "🪽", cake: "🍰", bike: "🚲", note: "📜", poke: "👉", music: "🎶", puzzle: "🧩", bin: "🗑️", wait: "⏳", boat: "⛵", chair: "🪑", knot: "🪢", point: "👉", bubble: "🫧", chew: "🍬", book: "📖", hook: "🪝", rope: "🪢", shout: "📣", toy: "🧸", cart: "🛒", pencil: "✏️", pot: "🍲", no: "🚫" };
    return map[icon] || "";
  }

  // words laid out centred, wrapped to maxWidth, the target word in berry
  function drawPhrase(ctx, words, target, cx, cy, maxWidth, size) {
    ctx.font = `900 ${size}px ${FONT_DISPLAY}`;
    const gap = size * 0.3;
    const widths = words.map(w => ctx.measureText(w.text).width);
    const lines = [];
    let line = []; let lw = 0;
    words.forEach((w, i) => {
      if (lw + widths[i] > maxWidth && line.length) { lines.push(line); line = []; lw = 0; }
      line.push(i); lw += widths[i] + gap;
    });
    if (line.length) lines.push(line);
    const lh = size * 1.25;
    const y0 = cy - ((lines.length - 1) * lh) / 2;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    lines.forEach((ln, li) => {
      const total = ln.reduce((a, i) => a + widths[i] + gap, -gap);
      let x = cx - total / 2;
      for (const i of ln) {
        const isTarget = words[i].text.replace(/[^a-z']/gi, "").toLowerCase() === target.toLowerCase();
        ctx.fillStyle = isTarget ? BERRY : INK;
        ctx.fillText(words[i].text, x, y0 + li * lh);
        x += widths[i] + gap;
      }
    });
  }

  function drawTree(ctx, o) {
    ctx.save();
    roundRect(ctx, o.x + 70, o.y - 380, 60, 380, 20);
    inkFill(ctx, WOOD_DEEP);
    // back-to-front lobes so the outlines read as one canopy
    for (const [cx, cy, rx, ry, col] of [[o.x - 40, o.y - 360, 150, 90, LEAF_DEEP], [o.x + 240, o.y - 360, 150, 90, LEAF_DEEP], [o.x + 100, o.y - 430, 250, 130, LEAF]]) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      inkFill(ctx, col);
    }
    ctx.restore();
  }

  function drawLandmark(ctx, lm) {
    if (lm.kind === "lanternPost") {
      roundRect(ctx, lm.x, GY - 300, 22, 300, 6);
      inkFill(ctx, WOOD_DEEP);
      roundRect(ctx, lm.x - 30, GY - 310, 90, 16, 6);
      inkFill(ctx, WOOD_DEEP);
      lantern(ctx, lm.x + 24, GY - 290, 48, { lit: lm.lit > 0.5, hang: true, glow: lm.lit });
      if (lm.lit > 0.5) sparkle(ctx, lm.x + 48, GY - 300, 10 + 4 * Math.sin(s.t * 5), 0.9);
    }
  }

  function drawFinale(ctx, room) {
    const cx = room.x0 + 330;
    const t = s.finale?.t || 0;
    const rise = Math.min(1, t / 0.8);
    ctx.save();
    // pedestal
    roundRect(ctx, cx - 90, GY - 40, 180, 40, 12);
    inkFill(ctx, pal.stone);
    // token: a big glowing story token with the stop's token name
    const r = 70 * easeBack(rise);
    ctx.save();
    ctx.globalAlpha = 0.5;
    const g = ctx.createRadialGradient(cx, GY - 140, 10, cx, GY - 140, 200);
    g.addColorStop(0, "rgba(255,225,120,.9)"); g.addColorStop(1, "rgba(255,225,120,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, GY - 140, 200, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, GY - 140 + Math.sin(s.t * 2) * 6, r, 0, Math.PI * 2);
    inkFill(ctx, GOLD);
    ctx.beginPath(); ctx.arc(cx, GY - 140 + Math.sin(s.t * 2) * 6, r * 0.7, 0, Math.PI * 2);
    inkFill(ctx, CREAM, 3);
    label(ctx, tokenGlyph(stop.token), cx, GY - 140 + Math.sin(s.t * 2) * 6, { size: r * 0.9, font: FONT_DISPLAY });
    for (let i = 0; i < 6; i += 1) {
      const a = s.t * 1.5 + i;
      sparkle(ctx, cx + Math.cos(a) * (r + 40), GY - 140 + Math.sin(a) * (r + 40) * 0.6, 8 + 4 * Math.sin(s.t * 4 + i), 0.9);
    }
    ctx.restore();
  }

  function tokenGlyph(token) {
    const map = { tub: "🛁", pillow: "🛏️", egg: "🥚", bridge: "🌉", lantern: "🏮", ladder: "🪜", ferry: "🛶", lunch: "🥪", wheel: "⚙️", note: "🎵", amber: "🟠", bones: "🦴", footprint: "🐾", scarf: "🧣", rock: "🪨", cog: "⚙️", ore: "⛏️", plate: "🍽️", lamp: "🔦", forge: "🔥", broom: "🧹", ripple: "💧", sparkle: "✨", glint: "💎", mirror: "🪞", hat: "🎩", wand: "🪄", signal: "🚨", cloud: "🌩️", beam: "🔆", moth: "🦋", echo: "🔊", wisp: "🕯️", orbit: "🪐", dome: "🔭", comet: "☄️", key: "🗝️", dawn: "🌅", skybridge: "🌈", star: "⭐" };
    return map[token] || "⭐";
  }

  function drawParticles(ctx) {
    for (const p of s.particles) {
      if (p.kind === "seed") {
        const tt = Math.max(0, Math.min(1, (p.t - p.delay) / p.dur));
        if (tt <= 0) continue;
        const e = easeOut(tt);
        const x = p.x + (p.tx - p.x) * e + Math.sin(tt * Math.PI) * p.curve;
        const y = p.y + (p.ty - p.y) * e - Math.sin(tt * Math.PI) * 120;
        sparkle(ctx, x, y, p.r * (1 - tt * 0.5), 1 - tt * 0.6);
      } else if (p.kind === "dust") {
        dust(ctx, p.x, p.y, p.r * (1 + p.age), Math.max(0, 1 - p.age / p.life) * 0.8);
      } else if (p.kind === "spark") {
        sparkle(ctx, p.x, p.y, p.r * Math.max(0, 1 - p.age / p.life), Math.max(0, 1 - p.age / p.life));
      } else if (p.kind === "confetti") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.age * p.spin);
        ctx.fillStyle = `hsl(${p.hue} 85% 60%)`;
        ctx.globalAlpha = Math.max(0, Math.min(1, (p.life - p.age)));
        ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      }
    }
  }

  function drawNpc(ctx) {
    const img = npc ? getImage(npc.sprite) : null;
    const n = s.npc;
    const state = n.walking ? "walk" : n.anim;
    const height = HERO_H * (npc?.scale || 1) * 1.05;
    drawPuppet(ctx, img, { src: npc?.sprite, x: n.x, y: GY, height, facing: n.facing, t: s.t + 1.3, state, puppet: n.puppet });
  }

  function drawBubble(ctx) {
    const n = s.npc;
    if (!n.bubble) return;
    const height = HERO_H * (npc?.scale || 1) * 1.05;
    const w = Math.min(440, Math.max(240, n.bubble.length * 11));
    // keep the whole bubble on screen (the character may stand at the edge)
    const vw = s.view.w / s.view.scale;
    const x = Math.max(s.camX + 12, Math.min(s.camX + vw - w - 12, n.x - w / 2 + 40));
    speechBubble(ctx, x, GY - height - 124, w, 84, n.bubble, { tailX: Math.max(x + 30, Math.min(x + w - 30, n.x + 10)), size: 22 });
  }

  function drawHero(ctx) {
    const src = hero?.heroSprite || hero?.sprite;
    const img = src ? getImage(src) : null;
    drawPuppet(ctx, img, { src, x: s.hero.x, y: s.hero.y, height: HERO_H, facing: s.hero.facing, t: s.t, state: s.hero.anim, puppet: s.hero.puppet });
  }

  function draw(ctx, w, h) {
    s.view = { w, h, scale: h / DESIGN_H };
    ctx.clearRect(0, 0, w, h);
    drawBackdrop(ctx);
    drawWorld(ctx);
    // next-room hint arrow when the room is done
    const room = currentRoom();
    if (room.done && room.kind !== "finale") {
      ctx.save();
      ctx.scale(s.view.scale, s.view.scale);
      ctx.translate(-s.camX, 0);
      const bob = s.reducedMotion ? 0 : Math.sin(s.t * 4) * 8;
      arrow(ctx, room.x1 + 60 + bob, GY - 200, 44, 1, 0.95);
      ctx.restore();
    }
  }

  // ── public API ─────────────────────────────────────────────────────────
  function pickables() {
    const room = currentRoom();
    if (!room.beat) return [];
    return room.objects
      .filter(o => o.role !== "none" && !o.hidden && o.visible !== false && !o.placed)
      .sort((a, b) => (a.role === "pick" ? 0 : 1) - (b.role === "pick" ? 0 : 1))
      .map(o => ({ id: o.id, kind: o.kind, label: proxyLabel(o, room.beat), role: o.role }));
  }

  function proxyLabel(o, beat) {
    switch (o.kind) {
      case "signpost": return `Hear ${o.card.grapheme}${o.card.anchorWord ? ` as in ${o.card.anchorWord}` : ""}`;
      case "crate": return `Letter ${o.option.grapheme}`;
      case "basket": return `Basket ${o.bin.grapheme}${o.bin.anchorWord ? ` (like ${o.bin.anchorWord})` : ""}`;
      case "item": return "Hear the word again";
      case "tile": return `Tile ${o.tile.grapheme}`;
      case "wordframe": return `Hear the word ${beat.view.word}`;
      case "stone": return o.role === "hear" ? `Hear stone ${o.stone.grapheme}` : `Stone ${o.stone.grapheme}`;
      case "optionSign": return o.option.word ? `Sign ${o.option.word}` : `Picture ${["one", "two", "three"][Number(o.id.slice(3))] || ""}`;
      case "bigLantern": return o.phrase ? `Hear: ${beat.view.phrase?.text || ""}` : `Hear ${beat.view.word}`;
      case "wordLantern": return `Lantern ${o.option.word}`;
      case "key": return o.heard ? `Try key ${o.keyOption.word}` : `Hear key ${o.keyOption.word}`;
      case "ruleboard": return "Hear the rule";
      case "board": return "Hear the note";
      case "door": return `Door: ${o.choice.label}`;
      default: return o.id;
    }
  }

  return {
    update,
    draw,
    pointerDown,
    key,
    setInput,
    applyOutcome,
    enterBeat,
    pickables,
    activateById: id => { const o = findObj(id); if (o) walkThenActivate(o); },
    startAt: index => {
      const i = Math.max(0, Math.min(index, s.rooms.length - 1));
      for (let k = 0; k < i; k += 1) { s.rooms[k].done = true; s.rooms[k].fenceOpen = 1; }
      s.hero.x = s.rooms[i].x0 + 160;
      s.hero.y = GY;
      s.npc.x = s.rooms[i].x0 + 640;
      s.camX = Math.max(0, s.rooms[i].x0);
      s.camTarget = s.camX;
      enterBeat(i);
    },
    finishBeat: () => { const room = currentRoom(); if (!room.done) markRoomDone(room); },
    goNext: () => { const next = s.rooms[s.beatIndex + 1]; if (next) { s.hero.walkTo = next.x0 + 160; s.hero.walkThen = null; } },
    get beatIndex() { return s.beatIndex; },
    get busy() { return s.hero.walkTo != null; },
    debug: () => ({ beatIndex: s.beatIndex, hero: { x: s.hero.x, y: s.hero.y, walkTo: s.hero.walkTo, onGround: s.hero.onGround }, room: { x0: currentRoom().x0, x1: currentRoom().x1, done: currentRoom().done, kind: currentRoom().kind }, objects: currentRoom().objects.map(o => ({ id: o.id, kind: o.kind, x: Math.round(o.x), y: Math.round(o.y), w: o.w, h: o.h, placed: o.placed, hidden: o.hidden, visible: o.visible })) }),
    get complete() { return s.complete; },
    get roomDone() { return currentRoom().done; },
    setBeatState: (i, st) => { s.beatStates[i] = st; },
    assets: () => [BACKDROPS[stop.backdrop], npc?.sprite, hero?.heroSprite || hero?.sprite, ...mission.beats.flatMap(b => [b.view.image, b.view.anchorImage, ...(b.view.cards || []).map(c => c.anchorImage), ...(b.view.options || []).map(o => o.image), ...(b.view.items || []).map(i => i.image), b.view.anchor?.image])]
  };
}
