import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  SSAOEffect,
  VignetteEffect
} from "postprocessing";

export const PREMIUM_QUEST_PALETTE = Object.freeze({
  cream: 0xf7edda,
  terracotta: 0xc86f57,
  sage: 0x78957d,
  lavender: 0x9890bd,
  sky: 0x9dc7d4,
  ink: 0x302d3b,
  honey: 0xf1c977
});

const TOKEN_FONT_URL = "/fonts/quest/helvetiker_bold.typeface.json";
const TOKEN_SHAPES = new Set([
  "sound-parcel",
  "seed-lantern",
  "awakened-lantern",
  "jump-flower",
  "flower-step",
  "river-plank",
  "bridge-plank",
  "placed-plank",
  "chorus-lantern",
  "lit-chorus-lantern",
  "delivered-parcel",
  "echo-orb",
  "echo-rune",
  "sound-pen",
  "flower",
  "fruit",
  "cake"
]);

const fontLoader = new FontLoader();
let tokenFontPromise = null;

function tokenText(spec) {
  return String(spec?.label || spec?.value || "")
    .trim()
    .replaceAll("_", "");
}

function paletteColour(text, order = 0) {
  const colours = [
    PREMIUM_QUEST_PALETTE.terracotta,
    PREMIUM_QUEST_PALETTE.sage,
    PREMIUM_QUEST_PALETTE.lavender,
    PREMIUM_QUEST_PALETTE.sky
  ];
  const hash = [...String(text)].reduce((sum, character) => sum + character.charCodeAt(0), Number(order) || 0);
  return colours[Math.abs(hash) % colours.length];
}

function premiumPhysicalMaterial(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.32,
    clearcoatRoughness: 0.38,
    sheen: 0.16,
    sheenRoughness: 0.5,
    envMapIntensity: 1.05,
    ...options
  });
}

function isSoftwareWebGLRenderer(renderer) {
  const context = renderer.getContext();
  const debugInfo = context.getExtension("WEBGL_debug_renderer_info");
  const rendererName = debugInfo
    ? context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : context.getParameter(context.RENDERER);
  return /swiftshader|software|llvmpipe/i.test(String(rendererName || ""));
}

function softwareQuality(quality) {
  return {
    ...quality,
    id: "low",
    pixelRatio: 1,
    shadows: false,
    shadowSize: 256,
    treeRows: 1,
    decorationStep: 16,
    ambientScale: 0.38,
    particleScale: 0.24,
    water: false,
    postEffects: false
  };
}

function createCinematicLighting(scene, {
  theme,
  lightMood,
  quality,
  initialPosition,
  worldLight = false
}) {
  const warmAmbient = new THREE.Color(theme.hemi).lerp(new THREE.Color(theme.sun), 0.18);
  const ambient = new THREE.AmbientLight(warmAmbient, 0.24 + (worldLight ? 0.04 : 0));
  const hemisphere = new THREE.HemisphereLight(
    new THREE.Color(theme.sky).lerp(new THREE.Color(PREMIUM_QUEST_PALETTE.cream), 0.18),
    new THREE.Color(theme.ground).lerp(new THREE.Color(PREMIUM_QUEST_PALETTE.terracotta), 0.12),
    0.32 + lightMood.glow * 0.06 + (worldLight ? 0.06 : 0)
  );

  const sun = new THREE.DirectionalLight(theme.sun, 1.1 + lightMood.glow * 0.25 + (worldLight ? 0.18 : 0));
  const sunOffset = new THREE.Vector3(
    -8 + lightMood.warmth * 3,
    15 + lightMood.glow * 2,
    10 - lightMood.warmth * 2
  );
  sun.position.set(
    initialPosition.x + sunOffset.x,
    (initialPosition.y || 0) + sunOffset.y,
    initialPosition.z + sunOffset.z
  );
  sun.target.position.set(initialPosition.x, initialPosition.y || 0, initialPosition.z);
  sun.castShadow = quality.shadows;
  sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -9;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 42;
  sun.shadow.bias = -0.0001;
  sun.shadow.normalBias = 0.024;
  sun.shadow.radius = quality.id === "rich" ? 2.6 : 1.5;

  const rim = new THREE.DirectionalLight(PREMIUM_QUEST_PALETTE.lavender, 0.22 + lightMood.glow * 0.12);
  rim.position.set(6, 5.5, -8);

  const accents = [
    new THREE.PointLight(PREMIUM_QUEST_PALETTE.honey, 0, 4.2, 2),
    new THREE.PointLight(PREMIUM_QUEST_PALETTE.lavender, 0, 4.2, 2)
  ];
  for (const light of accents) {
    light.visible = false;
    light.userData.questTargetAccent = true;
  }

  scene.add(ambient, hemisphere, sun, sun.target, rim, ...accents);
  return { ambient, hemisphere, sun, sunOffset, rim, accents };
}

function createPostPipeline(renderer, scene, camera, quality, lightMood) {
  if (!quality.postEffects) return null;
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const effects = [
    new SMAAEffect(),
    quality.id === "rich" ? new SSAOEffect(camera, null, {
      samples: 12,
      rings: 7,
      radius: 0.075,
      intensity: 0.68,
      luminanceInfluence: 0.58,
      resolutionScale: 0.72,
      bias: 0.02
    }) : null,
    new BloomEffect({
      intensity: 0.1 + lightMood.glow * 0.07,
      luminanceThreshold: 0.8,
      luminanceSmoothing: 0.34,
      mipmapBlur: true
    }),
    new VignetteEffect({ darkness: 0.13, offset: 0.3 })
  ].filter(Boolean);
  composer.addPass(new EffectPass(camera, ...effects));
  return composer;
}

export class QuestRenderPipeline {
  constructor({
    canvas,
    scene,
    camera,
    quality,
    theme,
    lightMood,
    initialPosition,
    worldLight = false
  }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.softwareRenderer = isSoftwareWebGLRenderer(this.renderer);
    this.quality = this.softwareRenderer ? softwareQuality(quality) : quality;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.pixelRatio));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    if (scene.background?.isColor) this.renderer.setClearColor(scene.background, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = true;
    this.maxAnisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    this.pmrem = null;
    this.environment = null;
    if (!this.softwareRenderer) {
      this.pmrem = new THREE.PMREMGenerator(this.renderer);
      const room = new RoomEnvironment();
      this.environment = this.pmrem.fromScene(room, 0.04).texture;
      this.environment.userData.questOwned = true;
      scene.environment = this.environment;
      disposeQuestScene(room);
    }

    this.lighting = createCinematicLighting(scene, {
      theme,
      lightMood,
      quality: this.quality,
      initialPosition,
      worldLight
    });
    this.composer = createPostPipeline(this.renderer, scene, camera, this.quality, lightMood);
    this.targetLightIntensity = this.quality.id === "rich" ? 8 : this.quality.id === "balanced" ? 4.5 : 0;
    this.cameraForward = new THREE.Vector3();
    this.worldPosition = new THREE.Vector3();
    this.destroyed = false;
  }

  resize(width, height) {
    this.renderer.setSize(width, height, false);
    this.composer?.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  updateTargetLights(items = []) {
    const visible = items.filter(item => item?.visible && item.userData?.premiumLetterToken);
    this.camera.getWorldDirection(this.cameraForward).setY(0).normalize();
    this.lighting.accents.forEach((light, index) => {
      const item = visible[index];
      light.visible = Boolean(item && this.targetLightIntensity > 0);
      light.intensity = light.visible ? this.targetLightIntensity : 0;
      if (!item) return;
      item.getWorldPosition(this.worldPosition);
      light.position.set(
        this.worldPosition.x + this.cameraForward.x * 0.72,
        this.worldPosition.y + 1.08,
        this.worldPosition.z + this.cameraForward.z * 0.72
      );
    });
  }

  render(deltaSeconds) {
    if (this.composer) this.composer.render(deltaSeconds);
    else this.renderer.render(this.scene, this.camera);
  }

  renderBackdrop() {
    this.renderer.clear(true, true, true);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.composer?.dispose?.();
    this.scene.environment = null;
    this.environment?.dispose?.();
    this.pmrem?.dispose?.();
    this.renderer.renderLists?.dispose?.();
    this.renderer.dispose();
  }
}

export function loadQuestTokenFont(url = TOKEN_FONT_URL) {
  if (!tokenFontPromise) {
    tokenFontPromise = fontLoader.loadAsync(url).catch(error => {
      tokenFontPromise = null;
      throw error;
    });
  }
  return tokenFontPromise;
}

export function isPhonicsTokenSpec(spec) {
  if (spec?.showToken === false) return false;
  const text = tokenText(spec);
  return TOKEN_SHAPES.has(spec?.shape)
    && text.length > 0
    && text.length <= 5
    && /^[a-z]+$/i.test(text);
}

export function createBeveledLetterToken({
  font,
  text,
  order = 0,
  jelly = false
}) {
  if (!font) throw new Error("A parsed Three.js font is required to build a letter token.");
  const label = String(text || "").trim();
  if (!label) throw new Error("Letter tokens require visible text.");

  const group = new THREE.Group();
  group.name = `premium-letter-${label}`;
  const allocations = { geometries: [], materials: [], textures: [] };
  const colour = paletteColour(label, order);
  const baseColour = new THREE.Color(colour).offsetHSL(0, -0.03, -0.08);

  const baseGeometry = new RoundedBoxGeometry(1.08, 0.96, 0.26, 6, 0.15);
  const baseMaterial = premiumPhysicalMaterial(baseColour, jelly ? {
    transmission: 0.16,
    thickness: 0.58,
    ior: 1.42,
    clearcoat: 0.5
  } : {});
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const faceGeometry = new RoundedBoxGeometry(0.9, 0.78, 0.1, 5, 0.12);
  const faceMaterial = premiumPhysicalMaterial(colour, {
    roughness: 0.32,
    clearcoat: 0.26,
    envMapIntensity: 1.12
  });
  const face = new THREE.Mesh(faceGeometry, faceMaterial);
  face.position.z = 0.15;
  face.castShadow = true;
  face.receiveShadow = true;
  group.add(face);

  const textGeometry = new TextGeometry(label, {
    font,
    size: 0.62,
    depth: 0.16,
    curveSegments: 14,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.025,
    bevelOffset: 0,
    bevelSegments: 5
  });
  textGeometry.computeBoundingBox();
  const bounds = textGeometry.boundingBox;
  const width = Math.max(0.001, bounds.max.x - bounds.min.x);
  const height = Math.max(0.001, bounds.max.y - bounds.min.y);
  const fit = Math.min(1, 0.74 / width, 0.56 / height);
  const textMaterial = premiumPhysicalMaterial(PREMIUM_QUEST_PALETTE.cream, {
    roughness: 0.26,
    clearcoat: 0.42,
    clearcoatRoughness: 0.28,
    envMapIntensity: 1.2
  });
  const glyph = new THREE.Mesh(textGeometry, textMaterial);
  glyph.scale.setScalar(fit);
  glyph.position.set(
    -(bounds.min.x + width / 2) * fit,
    -(bounds.min.y + height / 2) * fit,
    0.21
  );
  glyph.castShadow = true;
  glyph.receiveShadow = true;
  group.add(glyph);

  const hudAnchor = new THREE.Object3D();
  hudAnchor.name = "letter-hud-anchor";
  hudAnchor.position.set(0, 0.62, 0);
  group.add(hudAnchor);

  allocations.geometries.push(baseGeometry, faceGeometry, textGeometry);
  allocations.materials.push(baseMaterial, faceMaterial, textMaterial);
  const hudWorldPosition = new THREE.Vector3();
  group.userData.allocations = allocations;
  group.userData.hudAnchor = hudAnchor;
  group.userData.hudWorldPosition = hudWorldPosition;
  group.userData.updateHudWorldPosition = () => hudAnchor.getWorldPosition(hudWorldPosition);
  group.userData.dispose = () => {
    if (group.userData.disposed) return;
    group.userData.disposed = true;
    allocations.textures.forEach(texture => texture.dispose());
    allocations.materials.forEach(material => material.dispose());
    allocations.geometries.forEach(geometry => geometry.dispose());
  };
  return group;
}

export function attachBeveledLetterTokens(tasks, font) {
  let attached = 0;
  for (const task of tasks.values()) {
    for (const item of [...task.items, ...task.completions]) {
      const spec = item.userData.fieldSpec;
      if (!isPhonicsTokenSpec(spec) || item.userData.premiumLetterToken) continue;
      const flatLabel = item.children.find(child => child.name === "field-label");
      const token = createBeveledLetterToken({
        font,
        text: tokenText(spec),
        order: spec.order,
        jelly: spec.shape === "echo-orb" || spec.shape === "echo-rune"
      });
      token.position.set(0, flatLabel?.position.y || 1.14, 0.04);
      token.scale.setScalar(tokenText(spec).length > 3 ? 0.76 : 0.86);
      token.userData.fieldChoice = item.userData.fieldChoice || null;
      token.traverse(child => {
        child.userData.fieldChoice = item.userData.fieldChoice || null;
      });
      if (flatLabel) flatLabel.visible = false;
      item.add(token);
      item.userData.premiumLetterToken = token;
      item.userData.hudAnchor = token.userData.hudAnchor;
      item.userData.hudWorldPosition = token.userData.hudWorldPosition;
      item.userData.updateHudWorldPosition = token.userData.updateHudWorldPosition;
      item.userData.billboards = [...(item.userData.billboards || []), token];
      attached += 1;
    }
  }
  return attached;
}

export function disposeQuestScene(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root?.traverse?.(object => {
    if (object.geometry) geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material)
      ? object.material
      : object.material ? [object.material] : [];
    for (const material of objectMaterials) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture && (value.userData.questOwned || value.userData.questSurface)) textures.add(value);
      }
    }
  });
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
  root?.clear?.();
}
