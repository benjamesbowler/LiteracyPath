import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { CAST } from '../../src/features/soundSeekers/v3/content/cast.js';
import { createProgress } from '../../src/features/soundSeekers/v3/engine/progress.js';
import { CAMPAIGN_VERSION,CAMPAIGN_STAGES,CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { buildCampaignMission,createCampaignBeatState,resolveCampaignAction } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { MECHANICS } from '../../src/features/soundSeekers/v3/engine/challenges.js';
import { normalizeCampaignProgress,beginCampaignMission,updateCampaignCheckpoint } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';

let SoundSeekersCampaign, storage, vite;
const originalWindow = globalThis.window;
const values = new Map();
test.before(async () => {
  globalThis.window = { localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }, addEventListener() {}, removeEventListener() {} };
  vite = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  ({ default: SoundSeekersCampaign } = await vite.ssrLoadModule('/src/features/soundSeekers/v3/SoundSeekersCampaign.jsx'));
  storage = await vite.ssrLoadModule('/src/features/soundSeekers/v3/campaignStorage.js');
});
test.after(async () => { await vite?.close(); if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; });
function renderGame(progress, scope) {
  values.set(storage.campaignStorageKey(scope), JSON.stringify(progress));
  return renderToStaticMarkup(React.createElement(SoundSeekersCampaign, { progressScopeKey: scope, isSoundEnabled: false, onExit() {}, accessibilitySettings: {} }));
}

function resumedSupportFixture(mechanic,supported){
  const catalog={version:CAMPAIGN_VERSION,stages:CAMPAIGN_STAGES,missions:CAMPAIGN_MISSIONS};
  const mission=CAMPAIGN_MISSIONS.find(m=>m.id==='meadow-01-1');
  let progress=normalizeCampaignProgress({...createProgress(),heroChosen:true},catalog);
  const {beats}=buildCampaignMission(mission,progress);
  const beatIndex=beats.findIndex(beat=>beat.mechanic===mechanic&&(mechanic===MECHANICS.SIGNPOST?beat.view.cards[0].targetId==='m':beat.key.optionTargets[beat.key.optionId]==='m'&&beat.view.direction==='sound-to-letter'&&beat.supportContext.mode==='independent-check'));
  assert.ok(beatIndex>=0);const beat=beats[beatIndex],initialState=createCampaignBeatState(beat);
  const beatState=supported?resolveCampaignAction(beat,initialState,{type:'REQUEST_TEXT_SUPPORT'}).state:initialState;
  const attemptId=`initial-render-${mechanic}-${supported}`;
  progress=beginCampaignMission(progress,mission.id,{attemptId,challenges:beats,beatState:createCampaignBeatState(beats[0])},catalog,100);
  progress=updateCampaignCheckpoint(progress,mission.id,{attemptId,beatIndex,beatState},200);
  assert.equal(progress.campaign.activeMissionId,mission.id);assert.equal(progress.campaign.checkpoints[mission.id].beatIndex,beatIndex);
  return progress;
}

const renderedSupportLine=html=>html.match(/<div class="ss-campaign-line"[^>]*>(.*?)<\/div>/su)?.[1];

test('current campaign presents eight canonical playable Pals in one accessible chooser', () => {
  const html = renderGame(createProgress(), 'contract-hero');
  assert.match(html, /data-sound-seekers-game/);
  assert.match(html, /aria-label="Sound Seekers adventure"/);
  assert.match(html, /Who will you be\?/);
  assert.match(html, /role="dialog" aria-modal="true" aria-label="Choose your Pal"/);
  const chooser = html.split('class="ss-hero-grid"')[1].split('</section>')[0];
  assert.equal((chooser.match(/<button/g) || []).length, 8);
  for (const id of ['speedy','bouncy','woolly','splashy','clucky','muddy','chompy','pip']) assert.ok(chooser.includes(CAST[id].name), id);
  assert.match(html, /<canvas inert=""/);
  assert.doesNotMatch(html, /aria-label="Movement"/);
});

test('current campaign hub exposes movement, map, pause and accessible object actions', () => {
  const html = renderGame({ ...createProgress(), heroChosen: true }, 'contract-hub');
  assert.match(html, /data-sound-seekers-game/);
  assert.match(html, /Hollow Tree/);
  assert.match(html, /Sunny Meadow Farm/);
  for (const label of ['World map','Pause adventure','Movement','Move left','Move right','Jump','Interact with nearby object']) assert.ok(html.includes(`aria-label="${label}"`), label);
  assert.match(html, /aria-label="Adventure help"/);
  assert.match(html, /aria-label="Movement stick"/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.doesNotMatch(html, /role="dialog"/);
  assert.doesNotMatch(html, /<canvas inert/);
});

test('resumed visual introduction renders its explicit help from the saved checkpoint before effects run',()=>{
  const progress=resumedSupportFixture(MECHANICS.SIGNPOST,true),checkpoint=progress.campaign.checkpoints['meadow-01-1'];
  assert.ok(checkpoint.beatState.supportUsed.includes('visual-introduction'));
  const html=renderGame(progress,'contract-resume-introduction');
  assert.match(html,/data-presentation="platform"/);assert.equal(renderedSupportLine(html),'m: map.');
  assert.doesNotMatch(html,/role="dialog"/);
  const restored=storage.loadCampaignProgress('contract-resume-introduction');assert.equal(restored.ok,true);
  assert.equal(restored.progress.campaign.checkpoints['meadow-01-1'].beatIndex,checkpoint.beatIndex);
});

test('resumed supported echo renders the target and canonical example on its initial render',()=>{
  const progress=resumedSupportFixture(MECHANICS.ECHO_HUNT,true);
  assert.ok(progress.campaign.checkpoints['meadow-01-1'].beatState.supportUsed.includes('text-support'));
  const html=renderGame(progress,'contract-resume-echo-supported');
  assert.match(html,/data-presentation="platform"/);assert.equal(renderedSupportLine(html),'Find m. Map starts with /m/.');
  assert.doesNotMatch(html,/role="dialog"/);
});

test('an unsupported active echo does not print its hidden target or teaching answer on initial render',()=>{
  const progress=resumedSupportFixture(MECHANICS.ECHO_HUNT,false),state=progress.campaign.checkpoints['meadow-01-1'].beatState;
  assert.equal(state.modelShown,false);assert.deepEqual(state.supportUsed,[]);
  const html=renderGame(progress,'contract-resume-echo-independent');
  assert.match(html,/data-presentation="platform"/);assert.equal(renderedSupportLine(html),'');
  assert.doesNotMatch(html,/Find m\.|Map starts with \/m\/|m: map\./u);
});
