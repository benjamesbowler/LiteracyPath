import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  SelectiveBloomEffect,
  SMAAEffect,
  SSAOEffect,
  VignetteEffect
} from "postprocessing";

const PROFILES = Object.freeze({
  low: Object.freeze({
    id: "performance",
    tier: "low",
    environment: false,
    postEffects: false,
    ambientOcclusion: false,
    effectLabel: "off",
    anisotropy: 2,
    shadowSize: 512,
    shadowRadius: 1,
    materialResponse: 0.68
  }),
  medium: Object.freeze({
    id: "enhanced",
    tier: "medium",
    environment: true,
    postEffects: true,
    ambientOcclusion: false,
    effectLabel: "smaa-bloom",
    anisotropy: 4,
    shadowSize: 1024,
    shadowRadius: 1.6,
    materialResponse: 0.86
  }),
  high: Object.freeze({
    id: "cinematic",
    tier: "high",
    environment: true,
    postEffects: true,
    ambientOcclusion: true,
    effectLabel: "smaa-ssao-bloom",
    anisotropy: 8,
    shadowSize: 2048,
    shadowRadius: 2.4,
    materialResponse: 1
  })
});

const DEFAULT_MOOD = Object.freeze({
  bloomIntensity: 0.075,
  bloomThreshold: 0.88,
  bloomSmoothing: 0.2,
  vignetteDarkness: 0.12,
  vignetteOffset: 0.32,
  environmentIntensity: 0.9,
  aoIntensity: 0.68,
  aoRadius: 0.075
});

export function arcadeRenderProfile(tier, { softwareRenderer = false } = {}) {
  if (softwareRenderer) return PROFILES.low;
  return PROFILES[tier] || PROFILES.medium;
}

export function isSoftwareWebGLRenderer(renderer) {
  try {
    const context = renderer?.getContext?.();
    if (!context) return false;
    const debugInfo = context.getExtension?.("WEBGL_debug_renderer_info");
    const rendererName = debugInfo
      ? context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : context.getParameter(context.RENDERER);
    return /swiftshader|software|llvmpipe/i.test(String(rendererName || ""));
  } catch {
    return false;
  }
}

function disposeEnvironmentScene(root) {
  const geometries = new Set();
  const materials = new Set();
  root?.traverse?.(object => {
    if (object.geometry) geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material)
      ? object.material
      : object.material ? [object.material] : [];
    objectMaterials.forEach(material => materials.add(material));
  });
  materials.forEach(material => material.dispose?.());
  geometries.forEach(geometry => geometry.dispose?.());
  root?.clear?.();
}

function createPostPipeline(renderer, scene, camera, profile, mood) {
  if (!profile.postEffects) return null;
  const composer = new EffectComposer(renderer);
  try {
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new SelectiveBloomEffect(scene, camera, {
      intensity: mood.bloomIntensity,
      luminanceThreshold: mood.bloomThreshold,
      luminanceSmoothing: mood.bloomSmoothing,
      mipmapBlur: true
    });
    bloom.ignoreBackground = true;
    const effects = [
      new SMAAEffect(),
      profile.ambientOcclusion ? new SSAOEffect(camera, null, {
        samples: 10,
        rings: 6,
        radius: mood.aoRadius,
        intensity: mood.aoIntensity,
        luminanceInfluence: 0.6,
        resolutionScale: 0.68,
        bias: 0.02
      }) : null,
      bloom,
      new VignetteEffect({
        darkness: mood.vignetteDarkness,
        offset: mood.vignetteOffset
      })
    ].filter(Boolean);
    composer.addPass(new EffectPass(camera, ...effects));
    return { composer, bloom };
  } catch (error) {
    composer.dispose?.();
    throw error;
  }
}

function materialList(material) {
  return Array.isArray(material) ? material : material ? [material] : [];
}

function textureList(material) {
  if (!material) return [];
  return [
    material.map,
    material.normalMap,
    material.roughnessMap,
    material.metalnessMap,
    material.aoMap,
    material.emissiveMap,
    material.alphaMap
  ].filter(Boolean);
}

function shouldBloomObject(THREE, object) {
  if (object.userData.arcadeNoBloom) return false;
  return materialList(object.material).some(material => (
    material.userData.arcadeBloom === true
    || (
      !material.map
      && material.emissive?.isColor
      && material.emissive.getHex() !== 0x000000
      && Number(material.emissiveIntensity) >= 0.38
    )
    || (!material.map && material.blending === THREE.AdditiveBlending)
  ));
}

export class ArcadePremiumRenderPipeline {
  constructor({ THREE, renderer, scene, camera, tier = "medium", mood = {}, shadowLights = [] }) {
    this.THREE = THREE;
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.mood = { ...DEFAULT_MOOD, ...mood };
    this.softwareRenderer = isSoftwareWebGLRenderer(renderer);
    this.originalEnvironment = scene.environment || null;
    this.originalEnvironmentIntensity = scene.environmentIntensity;
    this.originalAutoClear = renderer.autoClear;
    this.pmrem = null;
    this.environmentTarget = null;
    this.environment = null;
    this.composer = null;
    this.bloom = null;
    this.profile = null;
    this.tier = null;
    this.shadowLights = new Set();
    this.renderFallback = false;
    this.selectionClock = 0;
    this.destroyed = false;
    shadowLights.forEach(light => this.registerShadowLight(light));
    this.setTier(tier, { force: true });
  }

  registerShadowLight(light, { enabled = true } = {}) {
    if (!light) return light;
    light.userData.arcadePremiumShadow = Boolean(enabled);
    this.shadowLights.add(light);
    this.configureShadowLight(light);
    return light;
  }

  unregisterShadowLight(light) {
    this.shadowLights.delete(light);
    light?.shadow?.map?.dispose?.();
    if (light?.shadow) light.shadow.map = null;
  }

  configureShadowLight(light) {
    if (!light || !this.profile) return;
    const enabled = light.userData.arcadePremiumShadow !== false;
    const castShadow = enabled && this.profile.tier !== "low";
    const sizeChanged = light.userData.arcadePremiumShadowSize !== this.profile.shadowSize;
    if ((!castShadow || sizeChanged) && light.shadow?.map) {
      light.shadow.map.dispose?.();
      light.shadow.map = null;
    }
    light.castShadow = castShadow;
    if (!light.shadow) return;
    light.shadow.mapSize.set(this.profile.shadowSize, this.profile.shadowSize);
    light.shadow.bias = -0.00012;
    light.shadow.normalBias = 0.024;
    light.shadow.radius = this.profile.shadowRadius;
    light.userData.arcadePremiumShadowSize = this.profile.shadowSize;
  }

  prepareObject(root = this.scene) {
    if (!root || !this.profile) return root;
    if (root === this.scene) this.bloom?.selection?.clear?.();
    const maxAnisotropy = Math.min(
      this.profile.anisotropy,
      this.renderer.capabilities?.getMaxAnisotropy?.() || this.profile.anisotropy
    );
    root.traverse?.(object => {
      const materials = materialList(object.material);
      for (const material of materials) {
        material.dithering = true;
        if ("envMapIntensity" in material) {
          if (!("arcadeOriginalEnvironmentMap" in material.userData)) {
            material.userData.arcadeOriginalEnvironmentMap = material.envMap || null;
          }
          if (material.userData.arcadeBaseEnvironmentIntensity == null) {
            material.userData.arcadeBaseEnvironmentIntensity = Number(material.envMapIntensity) || 1;
          }
          const originalEnvironmentMap = material.userData.arcadeOriginalEnvironmentMap;
          const environmentMap = this.profile.environment && !originalEnvironmentMap
            ? this.environment
            : originalEnvironmentMap;
          if (material.envMap !== environmentMap) {
            material.envMap = environmentMap;
            material.needsUpdate = true;
          }
          material.envMapIntensity = material.userData.arcadeBaseEnvironmentIntensity
            * this.mood.environmentIntensity
            * this.profile.materialResponse;
        }
        for (const texture of textureList(material)) {
          if (texture.anisotropy !== maxAnisotropy) {
            texture.anisotropy = maxAnisotropy;
            texture.needsUpdate = true;
          }
        }
      }
      if (shouldBloomObject(this.THREE, object)) this.bloom?.selection?.add?.(object);
    });
    return root;
  }

  refreshBloomSelection(root = this.scene) {
    if (!this.bloom || !root) return;
    this.bloom.selection?.clear?.();
    root.traverse?.(object => {
      if (shouldBloomObject(this.THREE, object)) this.bloom?.selection?.add?.(object);
    });
  }

  createEnvironment() {
    if (this.environment) return;
    this.pmrem = new this.THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    try {
      this.environmentTarget = this.pmrem.fromScene(room, 0.04);
      this.environment = this.environmentTarget.texture;
      this.environment.userData.arcadePremiumOwned = true;
    } finally {
      disposeEnvironmentScene(room);
    }
  }

  releaseEnvironment() {
    this.environmentTarget?.dispose?.();
    this.pmrem?.dispose?.();
    this.environmentTarget = null;
    this.environment = null;
    this.pmrem = null;
  }

  setTier(tier, { force = false } = {}) {
    if (this.destroyed) return;
    const nextTier = PROFILES[tier] ? tier : "medium";
    const nextProfile = arcadeRenderProfile(nextTier, { softwareRenderer: this.softwareRenderer });
    if (!force && this.tier === nextTier && (this.profile === nextProfile || this.renderFallback)) {
      this.updateCanvasContract();
      return;
    }
    this.tier = nextTier;
    this.profile = nextProfile;
    this.renderFallback = false;
    this.bloom?.selection?.clear?.();
    this.composer?.dispose?.();
    this.composer = null;
    this.bloom = null;
    this.renderer.autoClear = this.originalAutoClear;

    try {
      if (nextProfile.environment) {
        this.createEnvironment();
        this.scene.environment = this.environment;
        if ("environmentIntensity" in this.scene) this.scene.environmentIntensity = this.mood.environmentIntensity;
      } else {
        this.scene.environment = this.originalEnvironment;
        if ("environmentIntensity" in this.scene && this.originalEnvironmentIntensity != null) {
          this.scene.environmentIntensity = this.originalEnvironmentIntensity;
        }
      }
      const postPipeline = createPostPipeline(this.renderer, this.scene, this.camera, nextProfile, this.mood);
      this.composer = postPipeline?.composer || null;
      this.bloom = postPipeline?.bloom || null;
    } catch {
      // Optional image-quality work must never make the literacy game fail to
      // start. Unsupported effects fall back to the same direct-render path as
      // the low tier. A later genuine tier change can retry the premium path.
      this.bloom?.selection?.clear?.();
      this.composer?.dispose?.();
      this.composer = null;
      this.bloom = null;
      this.renderer.autoClear = this.originalAutoClear;
      this.scene.environment = this.originalEnvironment;
      if ("environmentIntensity" in this.scene && this.originalEnvironmentIntensity != null) {
        this.scene.environmentIntensity = this.originalEnvironmentIntensity;
      }
      this.releaseEnvironment();
      this.tier = "low";
      this.profile = PROFILES.low;
      this.renderFallback = true;
    }
    this.shadowLights.forEach(light => this.configureShadowLight(light));
    this.prepareObject();
    this.updateCanvasContract();
  }

  updateCanvasContract() {
    const canvas = this.renderer.domElement;
    if (!canvas || !this.profile) return;
    canvas.dataset.arcadeQualityTier = this.tier;
    canvas.dataset.arcadeRenderProfile = this.profile.id;
    canvas.dataset.arcadePostEffects = this.profile.effectLabel;
    canvas.dataset.arcadeEnvironment = this.profile.environment ? "room" : "off";
    canvas.dataset.arcadeSoftwareRenderer = String(this.softwareRenderer);
    canvas.dataset.arcadeBloomScope = this.profile.postEffects ? "emissive-effects" : "off";
    canvas.dataset.arcadeRenderFallback = String(this.renderFallback);
  }

  resize(width, height) {
    this.composer?.setSize(width, height);
  }

  render(deltaSeconds = 0) {
    if (this.composer) {
      try {
        this.composer.render(deltaSeconds);
      } catch {
        this.fallbackToDirectRender();
        this.renderer.render(this.scene, this.camera);
        return this.effectiveTier;
      }
      this.selectionClock += Math.max(0, Number(deltaSeconds) || 0);
      if (this.selectionClock >= 2) {
        this.selectionClock = 0;
        // Refresh only the lightweight live selection. Material and texture
        // preparation happens explicitly at creation/rebuild boundaries, so
        // this maintenance never triggers recurring GPU texture uploads.
        this.refreshBloomSelection(this.scene);
      }
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    return this.effectiveTier;
  }

  fallbackToDirectRender() {
    this.bloom?.selection?.clear?.();
    this.composer?.dispose?.();
    this.composer = null;
    this.bloom = null;
    this.renderer.autoClear = this.originalAutoClear;
    this.scene.environment = this.originalEnvironment;
    if ("environmentIntensity" in this.scene && this.originalEnvironmentIntensity != null) {
      this.scene.environmentIntensity = this.originalEnvironmentIntensity;
    }
    this.releaseEnvironment();
    this.tier = "low";
    this.profile = PROFILES.low;
    this.renderFallback = true;
    this.shadowLights.forEach(light => this.configureShadowLight(light));
    this.prepareObject(this.scene);
    this.updateCanvasContract();
  }

  restoreContext() {
    if (this.destroyed) return;
    this.releaseEnvironment();
    this.setTier(this.tier, { force: true });
  }

  get effectiveTier() {
    return this.profile?.tier || "low";
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.bloom?.selection?.clear?.();
    this.composer?.dispose?.();
    this.composer = null;
    this.bloom = null;
    this.renderer.autoClear = this.originalAutoClear;
    this.scene.environment = this.originalEnvironment;
    if ("environmentIntensity" in this.scene && this.originalEnvironmentIntensity != null) {
      this.scene.environmentIntensity = this.originalEnvironmentIntensity;
    }
    this.releaseEnvironment();
    [...this.shadowLights].forEach(light => this.unregisterShadowLight(light));
  }
}

export function createArcadePremiumRenderPipeline(options) {
  return new ArcadePremiumRenderPipeline(options);
}
