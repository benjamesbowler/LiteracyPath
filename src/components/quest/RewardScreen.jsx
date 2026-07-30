// THE REWARD — one per sound, one per stop, and the gear lands ON the creature.
//
// Reward density is deliberately high, and the cosmetic appears instantly rather
// than in a menu. Both of those are lifted straight from Teach Your Monster,
// because both of them are right.
//
// The stones that light here are the MASTERED ones — which may be none. That is
// not softened. A child who guessed their way through gets the gear and the
// stop, and an unlit stone, and the sound comes back tomorrow.

import { useEffect, useRef, useState } from "react";
import { ConfettiCelebration } from "../learn/games/shared/ConfettiCelebration.jsx";
import { getPiece } from "../../data/creatureParts.js";
import { displayGrapheme } from "./shells/shellContract.js";
import { playStarChime, playCelebrationFanfare } from "../../utils/audio/gameSfx.js";
import { playCueAudio, stopCueAudio } from "../../utils/audio/cuePlayer.js";
import { trailEventForStop } from "../../utils/questHub.js";
import { availableSparks } from "../../utils/questProgress.js";
import { getLedaInstructionAudioPath } from "../../data/ledaProductionAudio.js";

function useCeremonyPixelArt({ chapterId, world, cast, creature }) {
  const [art, setArt] = useState({ beastieSheet: "", friends: [] });

  useEffect(() => {
    if (!chapterId || !creature) return undefined;
    let active = true;
    Promise.all([
      import("./world/questPixelAvatar.js"),
      import("../../data/questPixelCast.js")
    ]).then(([avatar, residents]) => {
      if (!active) return;
      setArt({
        beastieSheet: avatar.createPixelBeastieSheet(creature).toDataURL("image/png"),
        friends: cast.map(friend => {
          const residentKey = residents.questPixelResidentKey(chapterId, friend.name, world);
          return {
            ...friend,
            spritePath: residents.questPixelResidentJumpPath(residentKey)
              || residents.questPixelResidentPath(residentKey)
          };
        })
      });
    });
    return () => { active = false; };
  }, [cast, chapterId, creature, world]);

  return art;
}

function PixelBeastieCelebration({ sheet }) {
  return (
    <span
      className="q-ceremony-pixel-beastie"
      style={sheet ? { backgroundImage: `url(${sheet})` } : undefined}
      aria-hidden="true"
    />
  );
}

export default function RewardScreen({
  stop,
  nextStop = null,
  stars,
  newStones = [],
  gear = null,
  chapterReward = null,
  sparkGain = 0,
  state = null,
  isSoundEnabled = true,
  overlay = false,
  onContinue,
  onTradingPost
}) {
  const gearPiece = gear ? getPiece(gear) : null;
  const event = trailEventForStop(stop);
  const sparkBalance = availableSparks(state);
  const completedStops = new Set(state?.trail?.stopsDone || []);
  const restoredPlaces = (chapterReward?.stopIds || []).filter(stopId => completedStops.has(stopId)).length;
  const ceremonyCast = chapterReward?.cast || [];
  const { beastieSheet, friends: visualCast } = useCeremonyPixelArt({
    chapterId: chapterReward?.chapterId,
    world: stop.world,
    cast: ceremonyCast,
    creature: state?.creature
  });
  const finale = chapterReward?.finale || null;
  const ceremonyLine = chapterReward
    ? `${chapterReward.destination} is awake. ${chapterReward.worldEffect}`
    : event.line;
  const dialogRef = useRef(null);
  const continueRef = useRef(null);
  const skipRef = useRef(null);
  const [ceremonyStage, setCeremonyStage] = useState(overlay ? 0 : 3);
  const ceremonyStageRef = useRef(ceremonyStage);
  const [osReducedMotion, setOsReducedMotion] = useState(() => Boolean(
    typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  ));
  const reducedMotion = Boolean(state?.settings?.reducedMotion || osReducedMotion);

  useEffect(() => {
    ceremonyStageRef.current = ceremonyStage;
  }, [ceremonyStage]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => setOsReducedMotion(Boolean(query.matches));
    syncReducedMotion();
    query.addEventListener?.("change", syncReducedMotion);
    if (!query.addEventListener) query.addListener?.(syncReducedMotion);
    return () => {
      query.removeEventListener?.("change", syncReducedMotion);
      if (!query.removeEventListener) query.removeListener?.(syncReducedMotion);
    };
  }, []);

  useEffect(() => {
    if (!overlay) return undefined;
    if (reducedMotion) {
      const timer = window.setTimeout(() => {
        ceremonyStageRef.current = 3;
        setCeremonyStage(3);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    // Turning Reduce Motion back off must not restart an already-stable reward.
    if (ceremonyStageRef.current >= 3) return undefined;
    const timers = [1, 2, 3].map(stage => window.setTimeout(
      () => setCeremonyStage(current => {
        const next = Math.max(current, stage);
        ceremonyStageRef.current = next;
        return next;
      }),
      stage * 1050
    ));
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [overlay, reducedMotion]);

  useEffect(() => {
    if (!isSoundEnabled) return undefined;
    playStarChime();
    const timers = [];
    if (stars >= 2) timers.push(setTimeout(playCelebrationFanfare, 380));
    // Existing recorded child voice; never substitute browser TTS if it fails.
    // The visual reward symbols and arrow action remain the fallback.
    if (stars > 0) timers.push(setTimeout(
      () => playCueAudio(getLedaInstructionAudioPath("Great job"), { volume: 0.9 }),
      stars >= 2 ? 1550 : 420
    ));
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      stopCueAudio();
    };
  }, [stars, isSoundEnabled]);

  useEffect(() => {
    if (!overlay) return undefined;
    const previousFocus = document.activeElement;
    skipRef.current?.focus();
    return () => previousFocus?.focus?.();
  }, [overlay]);

  useEffect(() => {
    if (!overlay || ceremonyStage < 3) return undefined;
    // The staged reveal removes the focused Skip button. Hand focus to the
    // primary action on both timer completion and the explicit skip path so a
    // keyboard/switch user is never stranded on <body> inside a modal.
    const frame = window.requestAnimationFrame(() => continueRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [ceremonyStage, overlay]);

  const containFocus = event => {
    if (!overlay || event.key !== "Tab") return;
    const controls = [...(dialogRef.current?.querySelectorAll("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])") || [])];
    if (!controls.length) return;
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <section
      className={`q-reward${overlay ? " q-reward-overlay" : " q-screen"}${reducedMotion ? " q-reward-reduced-motion" : ""}`}
      ref={dialogRef}
      data-event={event.mode}
      aria-modal={overlay ? "true" : undefined}
      role={overlay ? "dialog" : undefined}
      aria-label={`${stop.name} reward`}
      onKeyDown={containFocus}
    >
      {/* No stars, no confetti. Celebrating a run where the child got nothing
          right teaches them the celebration is meaningless. */}
      <ConfettiCelebration show={stars > 0} reducedMotion={reducedMotion} />

      <div className="q-reward-card q-reward-ceremony-card">
        <div className="q-reward-copy">
          <span className="q-reward-kicker">{chapterReward ? `${chapterReward.chapterTitle} restored` : "Trail repaired"}</span>
          <h1 className="q-title">{chapterReward?.destination || (event.mode === "section" ? stop.name : event.title)}</h1>
          <p className="q-reward-line">{ceremonyLine}</p>

          <div className={`q-ceremony-step${ceremonyStage >= 0 ? " is-revealed" : ""}`} aria-live="polite">
            {chapterReward && (
              <div className="q-seedwake-summary">
                <div>
                  <span>Chapter trail</span>
                  <strong>{restoredPlaces} of {chapterReward.stopIds.length} places repaired</strong>
                </div>
                {ceremonyCast.length > 0 && (
                  <ul className="q-ceremony-friends" aria-label="Friends celebrating with you">
                    {visualCast.map(friend => (
                      <li key={`${friend.name}-${friend.role}`}>
                        <span
                          className="q-ceremony-friend-sprite"
                          style={{ backgroundImage: `url(${friend.spritePath})` }}
                          aria-hidden="true"
                        />
                        <div><strong>{friend.name}</strong><small>{friend.role}</small></div>
                      </li>
                    ))}
                  </ul>
                )}
                {finale && (
                  <p className="q-ceremony-finale">
                    <strong>{finale.title}</strong>
                    <span>{finale.action}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {chapterReward && ceremonyStage >= 1 && (
            <div className="q-ceremony-relic q-ceremony-step is-revealed" aria-live="polite">
              <span aria-hidden="true" />
              <div>
                <strong>{chapterReward.label}</strong>
                <small>{chapterReward.abilityLabel}</small>
                <small>{chapterReward.worldEffect}</small>
              </div>
            </div>
          )}

          {ceremonyStage >= 2 && (
            <div className="q-ceremony-step q-ceremony-achievement is-revealed" aria-live="polite">
              <div className="q-reward-stars" aria-label={`${stars} of 3 stars`}>
                {[0, 1, 2].map(i => (
                  <span key={i} className={`q-star${i < stars ? " is-on" : ""}`} style={{ animationDelay: `${i * 140}ms` }}>★</span>
                ))}
              </div>

              <div className="q-reward-earned" aria-label="Rewards earned">
                {gearPiece && <span><span aria-hidden="true">◆ </span>New gear: <strong>{gearPiece.label}</strong></span>}
                <span>
                  <span aria-hidden="true">✦ </span>
                  {sparkGain > 0 ? <><strong>+{sparkGain} Sparks</strong> this trail · </> : null}
                  <strong>{sparkBalance} ready to spend</strong>
                </span>
                <span>
                  <span aria-hidden="true">● </span>
                  {newStones.length
                    ? `New sound stones: ${newStones.map(displayGrapheme).join(", ")}`
                    : "These sounds will return for more practice."}
                </span>
              </div>
            </div>
          )}

          {nextStop && ceremonyStage >= 3 && (
            <p className="q-reward-next">
              Next trail: <strong>{nextStop.name}</strong>
            </p>
          )}

          {ceremonyStage < 3 ? (
            <button ref={skipRef} type="button" className="q-ghost q-ceremony-skip" onClick={() => setCeremonyStage(3)}><span aria-hidden="true">★ </span>Show rewards now</button>
          ) : (
            <div className="q-ceremony-actions">
              <button ref={continueRef} type="button" className="q-primary" onClick={onContinue}><span aria-hidden="true">➜ </span>Continue the trail</button>
              {onTradingPost && <button type="button" className="q-ghost" onClick={onTradingPost}><span aria-hidden="true">◆ </span>Choose new gear</button>}
            </div>
          )}
        </div>

        <div
          className="q-reward-stage q-ceremony-view"
          data-equipped-gear={gearPiece?.id || "none"}
          role="img"
          aria-label={gearPiece ? `Your Beastie is wearing ${gearPiece.label}` : "Your Beastie celebrating"}
        >
          <span className="q-ceremony-ring is-outer" aria-hidden="true" />
          <span className="q-ceremony-ring is-inner" aria-hidden="true" />
          <span className="q-ceremony-relic-mark" aria-hidden="true" />
          {visualCast.length > 0 && (
            <span className="q-ceremony-cast-stage" aria-hidden="true">
              {visualCast.map(friend => (
                <span
                  key={`stage-${friend.name}-${friend.role}`}
                  className="q-ceremony-friend-sprite"
                  style={{ backgroundImage: `url(${friend.spritePath})` }}
                />
              ))}
            </span>
          )}
          {beastieSheet && (
            <PixelBeastieCelebration sheet={beastieSheet} />
          )}
        </div>
      </div>
    </section>
  );
}
