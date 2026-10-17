export const FLOWINK_FORMAT = "flowink" as const;
export const FLOWINK_FORMAT_VERSION = 1 as const;

export type FlowInkMode = "draw" | "sequence" | "studio";

export type EasingName =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "spring-soft"
  | "spring-snappy";

export type AnimationPreset =
  | "fade"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "scale"
  | "pop"
  | "draw";

export type AnimatableProperty =
  | "opacity"
  | "x"
  | "y"
  | "scaleX"
  | "scaleY"
  | "rotation"
  | "drawProgress";

export type SlideTransitionType =
  | "cut"
  | "fade"
  | "push-left"
  | "push-right"
  | "zoom"
  | "camera"
  | "smart";

export interface FlowInkMetadata {
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlowInkSettings {
  aspectRatio: "16:9";
  width: number;
  height: number;
  fps: number;
  showCursor: boolean;
}

export interface FlowInkTheme {
  name: "flowink-dark";
  background: string;
  surface: string;
  primary: string;
}

export interface FlowInkElementMeta {
  flowinkId: string;
  sourceId: string | null;
}

export interface FlowInkSceneElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  opacity: number;
  [key: string]: unknown;
}

export interface FlowInkScene {
  elements: readonly FlowInkSceneElement[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
}

export interface FlowInkStepAnimation {
  id: string;
  elementId: string;
  effect: "enter" | "exit";
  preset: AnimationPreset;
  duration: number;
  delay: number;
  easing: EasingName;
}

export interface FlowInkStep {
  id: string;
  name: string;
  animations: FlowInkStepAnimation[];
  cameraKeyframeId: string | null;
}

export interface FlowInkKeyframe {
  id: string;
  time: number;
  value: number;
  easing: EasingName;
}

export interface FlowInkAnimationTrack {
  id: string;
  elementId: string;
  property: AnimatableProperty;
  keyframes: FlowInkKeyframe[];
}

export interface FlowInkTimeline {
  duration: number;
  tracks: FlowInkAnimationTrack[];
}

export interface FlowInkCameraKeyframe {
  id: string;
  name: string;
  time: number;
  x: number;
  y: number;
  zoom: number;
  rotation: number;
  duration: number;
  easing: EasingName;
}

export interface FlowInkCamera {
  keyframes: FlowInkCameraKeyframe[];
}

export interface FlowInkSlideTransition {
  type: SlideTransitionType;
  duration: number;
  easing: EasingName;
}

export interface FlowInkSlide {
  id: string;
  name: string;
  scene: FlowInkScene;
  elementMeta: Record<string, FlowInkElementMeta>;
  steps: FlowInkStep[];
  timeline: FlowInkTimeline;
  camera: FlowInkCamera;
  transition: FlowInkSlideTransition;
}

export interface FlowInkAsset {
  id: string;
  name: string;
  mimeType: "image/svg+xml" | "image/png" | "image/jpeg" | "image/webp";
  size: number;
  dataUrl: string;
  createdAt: string;
}

export interface FlowInkProject {
  format: typeof FLOWINK_FORMAT;
  formatVersion: typeof FLOWINK_FORMAT_VERSION;
  metadata: FlowInkMetadata;
  theme: FlowInkTheme;
  settings: FlowInkSettings;
  slides: FlowInkSlide[];
  assets: Record<string, FlowInkAsset>;
}

type LegacyProjectV0 = Omit<FlowInkProject, "formatVersion" | "settings"> & {
  version: 0;
  settings: Partial<FlowInkSettings>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const createId = (prefix: string): string => {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) {
    return `${prefix}_${uuid}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const now = () => new Date().toISOString();

export const createEmptyScene = (): FlowInkScene => ({
  elements: [],
  appState: {
    viewBackgroundColor: "#ffffff",
    currentItemStrokeColor: "#1e1e1e",
    currentItemBackgroundColor: "transparent",
  },
  files: {},
});

export const createSlide = (name = "Slide 1"): FlowInkSlide => ({
  id: createId("slide"),
  name,
  scene: createEmptyScene(),
  elementMeta: {},
  steps: [],
  timeline: { duration: 8, tracks: [] },
  camera: { keyframes: [] },
  transition: { type: "fade", duration: 0.45, easing: "ease-in-out" },
});

export const createProject = (
  title = "Untitled FlowInk",
  description = "",
): FlowInkProject => {
  const timestamp = now();
  return {
    format: FLOWINK_FORMAT,
    formatVersion: FLOWINK_FORMAT_VERSION,
    metadata: {
      title,
      description,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    theme: {
      name: "flowink-dark",
      background: "#050805",
      surface: "#0b100d",
      primary: "#6dfc8c",
    },
    settings: {
      aspectRatio: "16:9",
      width: 1920,
      height: 1080,
      fps: 30,
      showCursor: false,
    },
    slides: [createSlide()],
    assets: {},
  };
};

const deepClone = <T>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

export const synchronizeElementMeta = (slide: FlowInkSlide): FlowInkSlide => {
  const next = deepClone(slide);
  const activeIds = new Set(next.scene.elements.map((element) => element.id));

  for (const element of next.scene.elements) {
    next.elementMeta[element.id] ??= {
      flowinkId: createId("element"),
      sourceId: null,
    };
  }

  for (const elementId of Object.keys(next.elementMeta)) {
    if (!activeIds.has(elementId)) {
      delete next.elementMeta[elementId];
    }
  }
  return next;
};

export const duplicateSlide = (
  source: FlowInkSlide,
  name = `${source.name} copy`,
): FlowInkSlide => {
  const clone = synchronizeElementMeta(deepClone(source));
  clone.id = createId("slide");
  clone.name = name;
  clone.elementMeta = Object.fromEntries(
    Object.entries(clone.elementMeta).map(([elementId, meta]) => [
      elementId,
      { flowinkId: meta.flowinkId, sourceId: elementId },
    ]),
  );
  clone.steps = clone.steps.map((step) => ({
    ...step,
    id: createId("step"),
    animations: step.animations.map((animation) => ({
      ...animation,
      id: createId("animation"),
    })),
  }));
  clone.timeline.tracks = clone.timeline.tracks.map((track) => ({
    ...track,
    id: createId("track"),
    keyframes: track.keyframes.map((keyframe) => ({
      ...keyframe,
      id: createId("keyframe"),
    })),
  }));
  clone.camera.keyframes = clone.camera.keyframes.map((keyframe) => ({
    ...keyframe,
    id: createId("camera"),
  }));
  return clone;
};

export const touchProject = (project: FlowInkProject): FlowInkProject => ({
  ...project,
  metadata: { ...project.metadata, updatedAt: now() },
});

export const serializeProject = (project: FlowInkProject): string =>
  JSON.stringify(project, null, 2);

const assertProjectShape: (
  value: unknown,
) => asserts value is FlowInkProject = (value) => {
  if (!isRecord(value) || value.format !== FLOWINK_FORMAT) {
    throw new Error("The file is not a FlowInk project.");
  }
  if (!Array.isArray(value.slides) || !isRecord(value.metadata)) {
    throw new Error("The FlowInk project is missing required fields.");
  }
};

const migrateV0ToV1 = (legacy: LegacyProjectV0): FlowInkProject => {
  const { version: _version, ...rest } = legacy;
  return {
    ...deepClone(rest),
    format: FLOWINK_FORMAT,
    formatVersion: FLOWINK_FORMAT_VERSION,
    settings: {
      aspectRatio: legacy.settings.aspectRatio ?? "16:9",
      width: legacy.settings.width ?? 1920,
      height: legacy.settings.height ?? 1080,
      fps: legacy.settings.fps ?? 30,
      showCursor: legacy.settings.showCursor ?? false,
    },
    slides: legacy.slides.map(synchronizeElementMeta),
  };
};

export const migrateProject = (value: unknown): FlowInkProject => {
  if (!isRecord(value) || value.format !== FLOWINK_FORMAT) {
    throw new Error("The file is not a FlowInk project.");
  }

  if (value.formatVersion === FLOWINK_FORMAT_VERSION) {
    assertProjectShape(value);
    return deepClone(value);
  }

  if (value.version === 0) {
    return migrateV0ToV1(value as unknown as LegacyProjectV0);
  }

  if (
    typeof value.formatVersion === "number" &&
    value.formatVersion > FLOWINK_FORMAT_VERSION
  ) {
    throw new Error(
      `This project uses unsupported format version ${value.formatVersion}.`,
    );
  }

  throw new Error("The FlowInk project has no supported formatVersion.");
};

export const parseProject = (source: string): FlowInkProject => {
  let data: unknown;
  try {
    data = JSON.parse(source) as unknown;
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
  return migrateProject(data);
};
