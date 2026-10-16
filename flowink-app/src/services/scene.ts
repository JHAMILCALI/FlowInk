import type {
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/element/types";
import type {
  FlowInkScene,
  FlowInkSceneElement,
} from "@flowink/project-schema";

const cloneSerializable = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

const APP_STATE_KEYS: readonly (keyof AppState)[] = [
  "viewBackgroundColor",
  "currentItemStrokeColor",
  "currentItemBackgroundColor",
  "currentItemFillStyle",
  "currentItemStrokeWidthKey",
  "currentItemStrokeStyle",
  "currentItemRoughness",
  "currentItemOpacity",
  "currentItemFontFamily",
  "currentItemFontSize",
  "currentItemTextAlign",
  "gridSize",
  "gridStep",
  "gridModeEnabled",
  "objectsSnapModeEnabled",
];

export const serializeScene = (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles,
): FlowInkScene => {
  const storedAppState: Record<string, unknown> = {};
  for (const key of APP_STATE_KEYS) {
    storedAppState[key] = appState[key];
  }
  return {
    elements: cloneSerializable(elements) as unknown as FlowInkSceneElement[],
    appState: cloneSerializable(storedAppState),
    files: cloneSerializable(files),
  };
};

export const toExcalidrawInitialData = (
  scene: FlowInkScene,
): ExcalidrawInitialDataState => ({
  elements: scene.elements as unknown as readonly ExcalidrawElement[],
  appState: scene.appState as Partial<AppState>,
  files: scene.files as BinaryFiles,
  scrollToContent: true,
});

export const toExcalidrawElements = (
  elements: readonly FlowInkSceneElement[],
): readonly ExcalidrawElement[] =>
  elements as unknown as readonly ExcalidrawElement[];

export const toBinaryFiles = (files: Record<string, unknown>): BinaryFiles =>
  files as BinaryFiles;
