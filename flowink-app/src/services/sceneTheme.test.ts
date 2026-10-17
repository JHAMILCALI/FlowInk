import { describe, expect, it } from "vitest";

import { applyDarkModeFilter, isColorDark } from "@excalidraw/common";

import { createTemplateSlide } from "./presets";
import { sceneForEditor, sceneFromEditor } from "./sceneTheme";

describe("dark-authored scenes", () => {
  const source = createTemplateSlide("mcp").scene;

  it("keeps the template visually dark under Excalidraw's dark filter", () => {
    const editorScene = sceneForEditor(source, "dark");

    expect(
      isColorDark(
        applyDarkModeFilter(editorScene.appState.viewBackgroundColor as string),
      ),
    ).toBe(true);
    for (const [index, element] of source.elements.entries()) {
      for (const key of ["strokeColor", "backgroundColor"] as const) {
        const color = element[key];
        if (typeof color !== "string" || color === "transparent") continue;
        expect(
          isColorDark(
            applyDarkModeFilter(editorScene.elements[index][key] as string),
          ),
        ).toBe(isColorDark(color));
      }
    }
  });

  it("restores stored colors exactly after an unchanged edit", () => {
    const editorScene = sceneForEditor(source, "dark");
    expect(sceneFromEditor(editorScene, source, "dark")).toEqual(source);
  });

  it("does not change authored colors in light mode", () => {
    expect(sceneForEditor(source, "light")).toBe(source);
    expect(sceneFromEditor(source, source, "light")).toBe(source);
  });
});
