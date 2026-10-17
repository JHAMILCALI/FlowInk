import {
  applyDarkModeFilter,
  isColorDark,
  removeDarkModeFilter,
} from "@excalidraw/common";
import type {
  FlowInkScene,
  FlowInkSceneElement,
} from "@flowink/project-schema";

type EditorTheme = "light" | "dark";

const colorKeys = ["strokeColor", "backgroundColor"] as const;
const appColorKeys = [
  "viewBackgroundColor",
  "currentItemStrokeColor",
  "currentItemBackgroundColor",
] as const;

const isDarkAuthoredScene = (scene: FlowInkScene, theme: EditorTheme) =>
  theme === "dark" &&
  typeof scene.appState.viewBackgroundColor === "string" &&
  isColorDark(scene.appState.viewBackgroundColor);

const mapColor = (
  value: unknown,
  transform: (color: string) => string,
): unknown =>
  typeof value === "string" && value !== "transparent"
    ? transform(value)
    : value;

const mapElement = (
  element: FlowInkSceneElement,
  transform: (color: string) => string,
): FlowInkSceneElement => {
  const next = { ...element };
  for (const key of colorKeys) {
    if (key in next) {
      next[key] = mapColor(next[key], transform);
    }
  }
  return next;
};

const mapScene = (
  scene: FlowInkScene,
  transform: (color: string) => string,
): FlowInkScene => {
  const appState = { ...scene.appState };
  for (const key of appColorKeys) {
    if (key in appState) {
      appState[key] = mapColor(appState[key], transform);
    }
  }
  return {
    ...scene,
    elements: scene.elements.map((element) => mapElement(element, transform)),
    appState,
  };
};

export const sceneForEditor = (
  source: FlowInkScene,
  theme: EditorTheme,
): FlowInkScene =>
  isDarkAuthoredScene(source, theme)
    ? mapScene(source, removeDarkModeFilter)
    : source;

export const sceneFromEditor = (
  edited: FlowInkScene,
  source: FlowInkScene,
  theme: EditorTheme,
): FlowInkScene => {
  if (!isDarkAuthoredScene(source, theme)) return edited;

  const originalElements = new Map(
    source.elements.map((element) => [element.id, element]),
  );
  const restoreColor = (value: unknown, original: unknown): unknown => {
    if (typeof value !== "string" || value === "transparent") return value;
    if (
      typeof original === "string" &&
      value === removeDarkModeFilter(original)
    ) {
      return original;
    }
    return applyDarkModeFilter(value);
  };

  const elements = edited.elements.map((element) => {
    const next = { ...element };
    const original = originalElements.get(element.id);
    for (const key of colorKeys) {
      if (key in next) {
        next[key] = restoreColor(next[key], original?.[key]);
      }
    }
    return next;
  });
  const appState = { ...edited.appState };
  for (const key of appColorKeys) {
    if (key in appState) {
      appState[key] = restoreColor(appState[key], source.appState[key]);
    }
  }
  return { ...edited, elements, appState };
};
