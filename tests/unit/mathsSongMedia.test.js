import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { mathsSongs, MATHS_PERFORMED_SONG_RELEASE_STATUSES } from "../../src/maths/music/mathsSongs.js";

const root = path.resolve(import.meta.dirname, "../..");
const absolutePublicPath = publicPath => path.join(root, "public", publicPath.replace(/^\/+/, ""));

test("every Maths song has one performance-first media contract and an honest local fallback", () => {
  assert.equal(mathsSongs.length, 8);
  for (const song of mathsSongs) {
    const { performed, fallback } = song.media;
    assert.equal(performed.publicPath, `/audio/music/maths/songs/${song.id}-performed.mp3`);
    assert.equal(performed.captionsPath, `/audio/music/maths/songs/${song.id}-lyrics.vtt`);
    assert.equal(performed.provider, "Suno");
    assert.equal(performed.provenance.childVoiceOrImage, false);
    assert.equal(performed.provenance.vocals, "adult-or-synthetic-adult");
    assert.equal(fallback.instrumentalPath, `/audio/music/maths/songs/${song.id}-instrumental.mp3`);
    assert.equal(fallback.guideRequestId, `song:${song.id}:guide`);
    assert.ok(fs.existsSync(absolutePublicPath(fallback.instrumentalPath)));
    if (MATHS_PERFORMED_SONG_RELEASE_STATUSES.includes(performed.releaseStatus)) {
      assert.ok(fs.existsSync(absolutePublicPath(performed.publicPath)), `${song.id} released performance must exist`);
      assert.ok(fs.existsSync(absolutePublicPath(performed.captionsPath)), `${song.id} released captions must exist`);
    }
  }
});

test("song credits mirror the authoritative runtime selection without inventing a Suno release", () => {
  for (const song of mathsSongs) {
    const credits = JSON.parse(fs.readFileSync(absolutePublicPath(song.media.performed.creditsPath), "utf8"));
    assert.equal(credits.schemaVersion, 2);
    assert.equal(credits.songId, song.id);
    assert.equal(credits.title, song.title);
    assert.equal(credits.tempo, song.tempo);
    assert.equal(credits.childVoiceOrImage, false);
    assert.equal(credits.performed.publicPath, song.media.performed.publicPath);
    assert.equal(credits.performed.captionsPath, song.media.performed.captionsPath);
    assert.equal(credits.performed.releaseStatus, song.media.performed.releaseStatus);
    assert.equal(credits.performed.provider, song.media.performed.provider);
    assert.equal(credits.fallback.publicPath, song.media.fallback.instrumentalPath);
    assert.equal(credits.fallback.releaseStatus, song.media.fallback.releaseStatus);
    if (song.media.performed.releaseStatus === "planned") {
      assert.equal(credits.performed.providerTrackId, "");
      assert.equal(credits.performed.sourceFileSha256, "");
    }
  }
});
