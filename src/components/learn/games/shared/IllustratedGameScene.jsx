import { ILLUSTRATED_GAME_SCENES } from "./illustratedGameScenes.js";

/**
 * Shared illustrated stage for the nine compact literacy games.
 *
 * The image is environmental art, not question evidence: it stays in its own
 * frame and has an empty alt so it cannot disclose or compete with the target.
 */
export function IllustratedGameScene({ mode, stageClassName = "", children }) {
  const scene = ILLUSTRATED_GAME_SCENES[mode];

  if (!scene) {
    throw new Error(`No illustrated game scene is registered for mode "${mode}".`);
  }

  const stageClasses = ["lg-game-stage", stageClassName].filter(Boolean).join(" ");

  return (
    <div
      className={`lg-illustrated-game lg-illustrated-game--${mode}`}
      data-game-scene={scene.id}
    >
      <div className="lg-illustrated-game-art" aria-hidden="true">
        <img
          src={scene.src}
          alt=""
          width={scene.width}
          height={scene.height}
          decoding="async"
          draggable="false"
        />
      </div>
      <section className={stageClasses}>
        {children}
      </section>
    </div>
  );
}

export default IllustratedGameScene;
