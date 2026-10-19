import { retainMockExecutableAssets } from './mockExecutableCache.js';

const OFFLINE_STATE_KEY = "lp-offline-shell-state-v1";
const OFFLINE_HISTORY_KEY = "lp-offline-shell-history-v1";
const OFFLINE_BUILD_KEY = "lp-offline-shell-build-v1";
export const OFFLINE_EVENT = "lp-offline-shell-state";

let registrationPromise = null;
let messageListenerInstalled = false;
let requestSequence = 0;
const warmResolvers = new Map();

function recordOfflineState(type, detail = {}) {
  const at = new Date().toISOString();
  const id = `${type}:${detail.buildId || "pending"}:${Date.now()}`;
  const state = {
    ...detail,
    id,
    type,
    at
  };
  try { window.sessionStorage.setItem(OFFLINE_STATE_KEY, JSON.stringify(state)); } catch { /* best effort */ }
  try {
    const history = JSON.parse(window.sessionStorage.getItem(OFFLINE_HISTORY_KEY) || "[]");
    window.sessionStorage.setItem(OFFLINE_HISTORY_KEY, JSON.stringify([...history, state].slice(-30)));
  } catch { /* best effort */ }
  window.__lpOfflineShellState = state;
  window.dispatchEvent(new CustomEvent(OFFLINE_EVENT, { detail: state }));
  return state;
}

function handleWorkerMessage(event) {
  const data = event.data || {};
  if (data.type === "LP_OFFLINE_SHELL_READY") {
    let previousBuildId = "";
    try { previousBuildId = window.localStorage.getItem(OFFLINE_BUILD_KEY) || ""; } catch { /* best effort */ }
    const type = navigator.onLine === false
      ? "offline-start"
      : previousBuildId && previousBuildId !== data.buildId
        ? "update-applied"
        : "shell-ready";
    try { window.localStorage.setItem(OFFLINE_BUILD_KEY, data.buildId || ""); } catch { /* best effort */ }
    recordOfflineState(type, { ...data, previousBuildId: previousBuildId || null });
    return;
  }
  if (data.type === "LP_OFFLINE_UPDATE_READY") {
    recordOfflineState("update-ready", data);
    return;
  }
  if (data.type === "LP_QUEST_WARM_COMPLETE") {
    const result = recordOfflineState("quest-warm-complete", data);
    warmResolvers.get(data.requestId)?.(result);
    warmResolvers.delete(data.requestId);
  }
}

function installMessageListener() {
  if (messageListenerInstalled || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.addEventListener("message", handleWorkerMessage);
  messageListenerInstalled = true;
}

export function latestOfflineShellState() {
  if (typeof window === "undefined") return null;
  if (window.__lpOfflineShellState) return window.__lpOfflineShellState;
  try { return JSON.parse(window.sessionStorage.getItem(OFFLINE_STATE_KEY) || "null"); } catch { return null; }
}

export function offlineShellHistory() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.sessionStorage.getItem(OFFLINE_HISTORY_KEY) || "[]"); } catch { return []; }
}

export function registerOfflineShell() {
  if (!import.meta.env.PROD || typeof window === "undefined" || !("serviceWorker" in navigator)) return Promise.resolve(null);
  if (registrationPromise) return registrationPromise;
  installMessageListener();
  registrationPromise = navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none"
  }).then(async registration => {
    if (registration.waiting) registration.waiting.postMessage({ type: "LP_OFFLINE_UPDATE_STATUS" });
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          worker.postMessage({ type: "LP_OFFLINE_UPDATE_STATUS" });
        }
      });
    });
    const ready = await navigator.serviceWorker.ready;
    const target = navigator.serviceWorker.controller || ready.active;
    target?.postMessage({ type: "LP_OFFLINE_STATUS" });
    return ready;
  }).catch(error => {
    recordOfflineState("shell-error", { message: String(error?.message || error || "Registration failed") });
    return null;
  });
  return registrationPromise;
}

export async function warmQuestOfflineAssets(urls = [], { chapterId = "" } = {}) {
  if (!import.meta.env.PROD) return null;
  const filtered = [...new Set(urls.map(value => String(value || "")).filter(Boolean))];
  if (!filtered.length) return null;
  const registration = await registerOfflineShell();
  const target = navigator.serviceWorker.controller || registration?.active;
  if (!target) return null;
  const requestId = `quest-warm-${Date.now()}-${requestSequence += 1}`;
  return new Promise(resolve => {
    const timer = window.setTimeout(() => {
      warmResolvers.delete(requestId);
      resolve(recordOfflineState("quest-warm-timeout", { requestId, chapterId, requested: filtered.length }));
    }, 20_000);
    warmResolvers.set(requestId, result => {
      window.clearTimeout(timer);
      resolve(result);
    });
    target.postMessage({ type: "LP_WARM_QUEST_ASSETS", requestId, chapterId, urls: filtered });
  });
}

export async function warmQuestOfflineExecutable() {
  if (!import.meta.env.PROD) return;
  const registration = await registerOfflineShell();
  const target = navigator.serviceWorker.controller || registration?.active;
  target?.postMessage({ type: "LP_WARM_QUEST_EXECUTABLE" });
}

/** Confirm assessment code in both the active and next shell; older installed workers use the same cache contract. */
export async function warmMockOfflineExecutable({ timeoutMs = 30000, signal, onProgress } = {}) {
  if (!import.meta.env.PROD) return { failed:0, development:true };
  let registrationTimer;
  const timedFetch=async(path,options={})=>{
    const controller=new AbortController();let timer,abort;
    try{return await Promise.race([fetch(path,{...options,signal:controller.signal}),new Promise((_,reject)=>{
      abort=()=>{controller.abort();reject(new Error('Assessment preparation cancelled'));};
      signal?.addEventListener('abort',abort,{once:true});
      timer=setTimeout(()=>{controller.abort();reject(new Error('Assessment code download timed out'));},timeoutMs);
      if(signal?.aborted)abort();
    })]);}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  };
  const registration=await Promise.race([registerOfflineShell(),new Promise(resolve=>{
    registrationTimer=setTimeout(()=>resolve(null),timeoutMs);
  })]);
  clearTimeout(registrationTimer);
  const target=navigator.serviceWorker.controller || registration?.active;
  if (!target) throw new Error('The assessment app could not be retained on this iPad.');
  const activeBuild=await new Promise((resolve,reject)=>{
    const cleanup=()=>{clearTimeout(timer);navigator.serviceWorker.removeEventListener('message',listener);};
    const listener=event=>{
      if (event.data?.type!=='LP_OFFLINE_SHELL_READY' || !/^[a-f0-9]{16}$/.test(event.data.buildId || '')) return;
      cleanup();resolve(event.data.buildId);
    };
    const timer=setTimeout(()=>{cleanup();reject(new Error('Assessment shell status unavailable'));},timeoutMs);
    navigator.serviceWorker.addEventListener('message',listener);
    target.postMessage({type:'LP_OFFLINE_STATUS'});
  });
  const metadata=await caches.open('lp-mock-executable-metadata-v1');
  let response;
  try {
    response=await timedFetch('/offline-build.json',{credentials:'omit',cache:'no-cache'});
    if (!response.ok) throw new Error('Build metadata unavailable');
  } catch {response=await metadata.match('/offline-build.json');}
  if (!response?.ok) throw new Error('Assessment build metadata unavailable');
  const build=await response.clone().json(), assets=build.mockExecutable?.assets;
  if (!/^[a-f0-9]{16}$/.test(build.buildId || '') || !Array.isArray(assets) || !assets.length || assets.length>512
    || assets.some(path=>!/^\/assets\/[A-Za-z0-9._-]+\.(js|css|woff2?)$/.test(path))) throw new Error('Invalid assessment executable pack');
  const stores=await Promise.all([...new Set([activeBuild,build.buildId])].map(id=>caches.open(`lp-shell-${id}`)));
  const retained=await retainMockExecutableAssets(assets,stores,{signal,timeoutMs,onProgress});
  await metadata.put('/offline-build.json',response);
  return {...retained,buildId:build.buildId,activeBuild};
}
