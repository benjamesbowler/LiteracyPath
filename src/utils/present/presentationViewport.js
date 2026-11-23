// The projector keeps its authored canvas. At smaller display sizes, reflow
// the same slide and buttons in CSS pixels so their focus and state stay native.
export const PRESENT_VIEWPORT_CSS = `
  #nav { height:auto; min-height:56px; flex-wrap:wrap; gap:6px; }
  #nav #overview-toggle, #nav #blank-toggle, #nav #fullscreen-toggle,
  #nav #finish, #nav #resume-interrupted, #nav #next { font:700 16px 'Source Sans 3', sans-serif; padding:6px 12px; }
  #nav #next:not([hidden]) { display:inline-flex; align-items:center; gap:6px; }
  #nav #next span[aria-hidden], #nav #prev { font-size:24px; }
  #nav #finish { color:white; background:var(--accent-700); border-color:var(--accent-700); }
  #counter { min-width:48px; }
  #rail-title { max-width:100%; }
  #start { gap:12px; overflow:auto; justify-content:safe center; }
  #start p { margin:0; }
  #start .p-start-focus { font-weight:700; color:var(--accent-700); }
  #start button { min-height:48px; font-size:clamp(20px,4vw,30px); padding:12px 24px; }
  #start #start-shortcuts { font-size:16px; }
  #finished { position:fixed; inset:0; z-index:14; display:grid; place-content:center; text-align:center; padding:24px; background:var(--bg); }
  #finished h2 { margin:0 0 20px; color:var(--ink); font:700 clamp(26px,4vw,44px) Andika,sans-serif; }
  .p-finish-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:12px; }
  .p-finish-actions button { min-height:44px; padding:8px 14px; border:2px solid var(--n-300); border-radius:12px; background:white; color:var(--ink); font:700 17px 'Source Sans 3',sans-serif; cursor:pointer; }
  #finish-return { background:var(--accent-700); border-color:var(--accent-700); color:white; }
  #overview { display:flex; flex-direction:column; gap:12px; overflow:hidden; border-radius:18px; }
  #overview header { margin:0; gap:8px; }
  #overview-list { display:block; max-height:none; min-height:0; overflow:auto; overscroll-behavior:contain; }
  .p-overview-group { margin:0 0 16px; }
  .p-overview-group h3 { margin:0 0 8px; font-size:18px; }
  .p-overview-entries { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr)); gap:8px; }
  #overview-list button { gap:10px; border-radius:12px; }
  #overview-list .p-overview-number { align-self:flex-start; min-width:2ch; color:var(--ink-muted); }
  #overview-list .p-overview-label { display:block; color:var(--ink); }
  #overview-list .p-overview-extra { display:block; color:var(--ink-muted); font-size:14px; font-weight:400; }
  #nav #fullscreen-status, #nav #audio-status {
    position:static; flex:0 0 100%; max-width:none; margin:0; padding:4px 8px;
    border:0; color:var(--ink-muted); text-align:center; font-size:15px;
  }

  @media (max-width:560px) {
    #nav { gap:4px; padding:4px; }
    #nav #overview-toggle, #nav #blank-toggle, #nav #fullscreen-toggle,
    #nav #finish, #nav #resume-interrupted { font-size:14px; padding:4px 8px; }
    #nav #next span:first-child { display:none; }
    #counter { min-width:42px; font-size:14px; }
    #overview { padding:12px; }
    #overview h2 { font-size:20px; }
    #overview #overview-close { font-size:14px; }
  }

  @media (max-width:1100px), (max-height:520px) {
    body[data-lesson-day]:not([data-lesson-day=""]):not(.embedded) #scaler {
      top:52px; bottom:var(--present-nav-height,56px);
    }
    body[data-lesson-day]:not([data-lesson-day=""]) #stage {
      inset:0; top:0 !important; width:100%; height:100%; transform:none !important;
    }
    body[data-lesson-day]:not([data-lesson-day=""]) #deck {
      height:100%; overflow:auto; padding-bottom:4px; overscroll-behavior:contain;
    }
    body[data-lesson-day]:not([data-lesson-day=""]) #lesson-progress { height:4px; }
    body[data-lesson-day]:not([data-lesson-day=""]) .slide.active {
      position:relative; inset:auto; min-height:100%; width:min(100%,1100px); margin-inline:auto;
      justify-content:safe center; overflow:visible; padding:16px clamp(14px,4vw,44px); gap:12px;
    }
    .slide > *, .slide img { max-width:100%; }
    .slide .p-kicker, .slide .p-teacher-prompt, .slide .p-h2, .slide .p-says { margin:0; font-size:clamp(16px,2vw,21px); }
    .slide .p-kicker { font-size:14px; letter-spacing:.06em; }
    .slide .p-lesson-actions, .slide .p-sound-row, .slide .p-write-actions { gap:8px; margin:0; }
    .slide button { min-width:44px; min-height:44px; touch-action:manipulation; }
    .slide .p-audio, .slide .p-reveal-btn { font-size:16px; min-height:44px; padding:8px 12px; gap:6px; border-width:2px; }
    .slide .p-two-col, .slide .p-picture-game, .slide .p-picture-sentence, .slide .p-language-layout, .slide .p-class-game {
      grid-template-columns:minmax(0, 1fr) minmax(0, 2fr); gap:16px;
    }
    .slide .p-col-left, .slide .p-col-right, .slide .p-picture-sentence > div, .slide .p-class-response, .slide .p-language-response,
    .slide .p-missing-game, .slide .p-choice-bank, .slide .p-match { min-width:0; gap:10px; }
    .slide .p-disc { width:min(100%,220px); height:auto; aspect-ratio:1; }
    .slide .p-letter { font-size:clamp(42px,9vw,100px) !important; }
    .slide .p-words { gap:8px; }
    .slide .p-word { min-width:0; padding:6px; gap:4px; border-radius:12px; border-width:2px; }
    .slide .p-word img { width:100%; height:clamp(46px,11vw,110px); }
    .slide .p-word span { font-size:clamp(18px,3vw,32px); overflow-wrap:anywhere; }
    .slide .p-pal-corner { display:none; }
    .slide .p-review-focus, .slide.p-sight-slide .p-sight { font-size:clamp(52px,12vw,130px); margin:4px 0; }
    .slide .p-recap-stimulus { min-height:0; gap:8px; max-width:660px; margin:8px auto; }
    .slide .p-recap-anchor img { width:100%; height:clamp(90px,24vw,200px); }
    .slide .p-recap-anchor figcaption, .slide .p-hfw-example { font-size:clamp(23px,4.6vw,48px); margin:8px 0; }
    .slide .p-review-count { font-size:16px; margin:0 0 6px; }
    .slide .p-roundup-stimulus { gap:12px; margin:10px 0; }
    .slide .p-roundup-stimulus span { font-size:clamp(32px,7vw,78px); }
    .slide.p-writing.active { height:100%; }
    .slide.p-writing .p-paper { border-radius:16px; padding:8px; }
    .slide.p-writing .p-write-ready { min-height:0; font-size:16px; }
    .slide.p-writing .p-write-actions { justify-content:center; }
    .slide .p-compound, .slide .p-build-bank, .slide .p-build-slots, .slide .p-build, .slide .p-spelling-layout > div { gap:8px; }
    .slide .p-tile, .slide .p-tile-btn, .slide .p-spelling-layout .p-tile-btn, .slide .p-made, .slide .p-spelling-layout .p-build-slot {
      height:auto; min-height:48px; min-width:48px; width:auto; padding:6px 12px; border-radius:12px; font-size:clamp(26px,5vw,54px);
    }
    .slide .p-response, .slide.p-pattern-read .p-response { padding:6px 12px; font-size:clamp(26px,5vw,54px); }
    .slide.p-pattern-read .p-answer { gap:8px; flex-wrap:wrap; }
    .slide .p-arrow { width:36px; height:36px; }
    .slide .p-spelling-layout { gap:12px; }
    .slide .p-picture-sentence img, .slide .p-spelling-picture, .slide .p-game-picture, .slide .p-language-picture, .slide .p-class-picture {
      width:100%; height:clamp(90px,24vw,245px); padding:8px; border-radius:14px;
    }
    .slide .p-spelling-picture { width:clamp(80px,24vw,240px); }
    .slide .p-picture-sentence .p-shared-sentence { font-size:clamp(24px,4.6vw,48px); gap:2px; padding:8px; border-radius:12px; }
    .slide .p-shared-sentence span { padding:0 3px; border-bottom-width:3px; }
    .slide .p-language-stem, .slide .p-class-sentence, .slide .p-meaning-prompt { font-size:clamp(22px,4vw,38px); }
    .slide .p-language-choices { gap:8px; }
    .slide .p-choice, .slide .p-language-choice { min-height:44px; padding:6px 10px; font-size:clamp(19px,3.6vw,34px); border-width:2px; border-radius:12px; }
    .slide .p-language-mark, .slide.p-syllable .p-language-choice { min-width:48px; min-height:48px; font-size:clamp(30px,6vw,58px); }
    .slide .p-language-mark { font-size:clamp(32px,6.6vw,72px); }
    .slide .p-phonology-model, .slide .p-phonology-option { min-width:0; gap:6px; }
    .slide .p-phonology-option .p-language-choice { min-width:44px; gap:4px; }
    .slide .p-phonology-option img { width:clamp(42px,9vw,100px); height:clamp(42px,9vw,92px); }
    .slide .p-round-progress, .slide .p-scramble-count { font-size:18px; }
    .slide .p-scramble-bank, .slide .p-scramble-draft { min-height:48px; gap:6px; padding:4px 0; }
    .slide .p-scramble-bank button, .slide .p-scramble-draft button { font-size:clamp(18px,3vw,28px); padding:4px 8px; border-radius:10px; }
    .slide .p-missing-items, .slide .p-match-grid { gap:8px; }
    .slide .p-missing-items span { min-width:58px; padding:8px; font-size:clamp(25px,4.8vw,52px); border-radius:12px; }
    .slide .p-match-card { height:clamp(48px,12vw,100px); border-radius:12px; border-width:2px; font-size:clamp(22px,4vw,44px); }
    .slide .p-match-card.is-matched .p-card-word::after { font-size:16px; }
    .slide .p-game-feedback, .slide .p-class-feedback, .slide .p-spelling-layout .p-build-feedback,
    .slide .p-feedback, .slide [data-sort-feedback] { min-height:0; font-size:16px; padding:4px; }
    .slide .p-sort-items, .slide .p-sort-bins { gap:8px; margin:8px 0; }
    .slide .p-sort-choice { min-width:0; flex:1; gap:4px; }
    .slide .p-sort-choice .p-audio { font-size:14px; padding:4px; }
    .slide .p-sort-choice .p-audio .p-ico { flex:none; }
    .slide .p-sort-item { width:100%; height:auto; min-height:44px; padding:4px; border-radius:12px; border-width:2px; }
    .slide .p-sort-item img { width:100%; height:clamp(52px,16vw,140px); }
    .slide .p-sort-item span, .slide .p-sort-bins [data-sort-placed] { font-size:16px; }
    .slide [data-sort-bin] { min-height:48px; padding:6px; font-size:18px; border-radius:12px; border-width:2px; }
    .slide .p-sort-bins strong { font-size:clamp(26px,5vw,54px); }
    .slide .p-short-picture { height:clamp(100px,20vw,225px); }
    .slide .p-short-title { font-size:clamp(24px,4vw,38px); }
    .slide .p-short-question-layout { gap:12px; }
    .slide .p-short-story, .slide .p-short-reread, .slide .p-short-prompt { font-size:clamp(18px,2.8vw,30px); }
    .slide .p-short-options, .slide .p-short-evidence, .slide .p-short-note { font-size:clamp(16px,2.1vw,23px); }
    .slide .p-short-options { padding-left:28px; }
    .slide .p-media-failure { position:relative; inset:auto; width:100%; padding:8px; font-size:16px; border-width:2px; }
    .slide .p-media-failure button { min-height:44px; }
  }

  @media (max-width:600px) {
    .slide .p-two-col, .slide .p-picture-game, .slide .p-picture-sentence, .slide .p-language-layout, .slide .p-class-game,
    .slide .p-short-question-layout { grid-template-columns:minmax(0,1fr); gap:10px; }
    .slide .p-col-left { flex-direction:row; align-items:center; }
    .slide .p-disc { width:120px; flex:none; }
    .slide .p-game-picture, .slide .p-language-picture, .slide .p-class-picture,
    .slide .p-picture-sentence img { height:clamp(96px,30vw,150px); }
    .slide .p-words-1 { grid-template-columns:minmax(0,1fr); }
    .slide .p-match-grid, .slide .p-sort-items { gap:6px; }
    .slide .p-sort-choice .p-audio { justify-content:center; flex-wrap:wrap; }
  }
`;
