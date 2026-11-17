import type { FaceLandmarker, HandLandmarker } from "@mediapipe/tasks-vision";

// Runtime assets are fetched from public CDNs when a visitor starts a demo (not bundled).
const VERSION = "1.2.3";
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

async function load() {
  const mod = await import("@mediapipe/tasks-vision");
  const fileset = await mod.FilesetResolver.forVisionTasks(WASM);
  return { mod, fileset };
}

export async function createHandLandmarker(): Promise<HandLandmarker> {
  const { mod, fileset } = await load();
  const make = (delegate: "GPU" | "CPU") =>
    mod.HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: HAND_MODEL, delegate },
      runningMode: "VIDEO",
      numHands: 1,
    });
  try { return await make("GPU"); } catch { return await make("CPU"); }
}

export async function createFaceLandmarker(): Promise<FaceLandmarker> {
  const { mod, fileset } = await load();
  const make = (delegate: "GPU" | "CPU") =>
    mod.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL, delegate },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
    });
  try { return await make("GPU"); } catch { return await make("CPU"); }
}

export const HAND_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17],
];
