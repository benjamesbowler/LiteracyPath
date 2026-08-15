import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  applyQualityTier,
  attachContextLossGuard,
  attachResize,
  createFrameLoop,
  createPerspectiveCamera,
  createRenderer,
  createScene,
  detectQualityTier,
  disposeObject,
  disposeRenderer,
  prefersReducedMotion,
  QUALITY_TIERS,
  shadowMapForTier
} from "../../components/learn/games/shared/threeShell.js";

const CHOICE_POSITIONS = Object.freeze([
  Object.freeze([-2.65, 0.64, -1.25]),
  Object.freeze([0, 0.64, -1.78]),
  Object.freeze([2.65, 0.64, -1.25])
]);

function addLowPolyTree(scene, x, z, scale = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14 * scale, 0.2 * scale, 1.25 * scale, 7),
    new THREE.MeshStandardMaterial({ color: 0x775033, roughness: 1 })
  );
  trunk.position.set(x, 0.62 * scale, z);
  trunk.castShadow = true;
  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(0.86 * scale, 1.8 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x3f7f55, roughness: 1 })
  );
  crown.position.set(x, 1.76 * scale, z);
  crown.castShadow = true;
  scene.add(trunk, crown);
}

function createFluffSprite(isActive) {
  const material = new THREE.SpriteMaterial({ color: 0xffffff, depthTest: true, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.65, 1.65, 1);
  sprite.position.set(0, 0.95, 3.2);
  const loader = new THREE.TextureLoader();
  loader.load(
    "/images/companions/fluff.webp",
    texture => {
      if (!isActive()) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      material.map = texture;
      material.needsUpdate = true;
    },
    undefined,
    () => { material.opacity = 0; }
  );
  return sprite;
}

/**
 * A progressive 3D layer for Number Trail. The DOM stones remain the complete,
 * semantic game, so WebGL availability and rendering speed never decide the
 * mathematical result.
 */
export function MathsNumberTrailThree({ paused = false, selectedSlot = null }) {
  const mountRef = useRef(null);
  const selectedRef = useRef(selectedSlot);
  const pausedRef = useRef(paused);
  const [renderState, setRenderState] = useState(() => typeof window !== "undefined" && prefersReducedMotion() ? "fallback" : "loading");

  useEffect(() => { selectedRef.current = selectedSlot; }, [selectedSlot]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let renderer;
    let detachResize = () => {};
    let detachContext = () => {};
    let scene;
    let loop;
    let active = true;
    let hidden = document.visibilityState === "hidden";
    if (prefersReducedMotion()) {
      return () => { active = false; };
    }
    try {
      const qualityTier = detectQualityTier();
      scene = createScene(THREE, new THREE.Fog(0xb7dfe1, 8, 27));
      scene.background = new THREE.Color(0xb7dfe1);
      const camera = createPerspectiveCamera(THREE, {
        fov: 43,
        aspect: Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight),
        near: 0.1,
        far: 45,
        position: [0, 6.25, 10.25],
        lookAt: [0, 0.45, -1.25]
      });
      renderer = createRenderer(THREE, {
        antialias: true,
        pixelRatioCap: QUALITY_TIERS[qualityTier].pixelRatioCap,
        powerPreference: qualityTier === "low" ? "low-power" : "default",
        shadowMap: shadowMapForTier(qualityTier, "pcf"),
        toneMappingExposure: 1.08
      });
      applyQualityTier(renderer, qualityTier);
      renderer.setSize(Math.max(1, mount.clientWidth), Math.max(1, mount.clientHeight));
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.className = "maths-number-trail-three-canvas";
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xf4fbff, 0x416746, 2.45));
      const sun = new THREE.DirectionalLight(0xfff0c7, 2.25);
      sun.position.set(-4, 8, 7);
      sun.castShadow = qualityTier !== "low";
      sun.shadow.mapSize.set(qualityTier === "high" ? 1024 : 512, qualityTier === "high" ? 1024 : 512);
      scene.add(sun);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(32, 28),
        new THREE.MeshStandardMaterial({ color: 0x7fad6b, roughness: 1 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.05;
      ground.receiveShadow = true;
      scene.add(ground);

      const river = new THREE.Mesh(
        new THREE.PlaneGeometry(10.5, 5.3),
        new THREE.MeshStandardMaterial({ color: 0x68b8c6, roughness: 0.38, metalness: 0.08 })
      );
      river.rotation.x = -Math.PI / 2;
      river.position.set(0, 0.015, -1.35);
      scene.add(river);

      const trailMaterial = new THREE.MeshStandardMaterial({ color: 0xe9e1c0, roughness: 0.96 });
      [[0, 2.95], [0, 1.75], [0, 0.62], ...CHOICE_POSITIONS.map(([x, , z]) => [x, z])].forEach(([x, z], index) => {
        const stone = new THREE.Mesh(new THREE.CylinderGeometry(index < 3 ? 0.63 : 0.88, index < 3 ? 0.72 : 1, 0.28, 10), trailMaterial);
        stone.position.set(x, 0.12, z);
        stone.rotation.y = index * 0.37;
        stone.castShadow = true;
        stone.receiveShadow = true;
        scene.add(stone);
      });

      addLowPolyTree(scene, -5.2, 0.2, 1.35);
      addLowPolyTree(scene, 5.4, 0.1, 1.2);
      addLowPolyTree(scene, -6.2, -4.4, 0.95);
      addLowPolyTree(scene, 6.1, -4.6, 1.05);

      const fluff = createFluffSprite(() => active);
      scene.add(fluff);
      const start = new THREE.Vector3(0, 0.95, 3.2);
      const target = start.clone();
      let previousFrame = performance.now();
      loop = createFrameLoop(now => {
        const delta = Math.min(0.05, Math.max(0, (now - previousFrame) / 1000));
        previousFrame = now;
        const slot = selectedRef.current;
        if (Number.isInteger(slot) && CHOICE_POSITIONS[slot]) {
          const [x, y, z] = CHOICE_POSITIONS[slot];
          target.set(x, y + 0.42, z + 0.45);
        } else {
          target.copy(start);
        }
        if (!pausedRef.current && !hidden) {
          fluff.position.lerp(target, 1 - Math.pow(0.0008, delta));
          fluff.material.rotation = Math.sin(now / 330) * 0.025;
        }
        renderer.render(scene, camera);
      });

      detachResize = attachResize({
        mount,
        renderer,
        camera,
        width: () => Math.max(1, mount.clientWidth),
        height: () => Math.max(1, mount.clientHeight)
      });
      detachContext = attachContextLossGuard(renderer, {
        onLost: () => { if (active) setRenderState("fallback"); },
        onRestored: () => { if (active) setRenderState("ready"); }
      });
      const onVisibility = () => { hidden = document.visibilityState === "hidden"; };
      document.addEventListener("visibilitychange", onVisibility);
      loop.start(true);
      queueMicrotask(() => { if (active) setRenderState("ready"); });
      return () => {
        active = false;
        document.removeEventListener("visibilitychange", onVisibility);
        loop.stop();
        detachContext();
        detachResize();
        disposeObject(scene);
        disposeRenderer(renderer, { forceContextLoss: true });
      };
    } catch {
      queueMicrotask(() => { if (active) setRenderState("fallback"); });
      if (loop) loop.stop();
      detachContext();
      detachResize();
      if (scene) disposeObject(scene);
      if (renderer) disposeRenderer(renderer, { forceContextLoss: true });
      return () => { active = false; };
    }
  }, []);

  return <div
    aria-hidden="true"
    className={`maths-number-trail-three is-${renderState}`}
    data-render-state={renderState}
    ref={mountRef}
  />;
}
