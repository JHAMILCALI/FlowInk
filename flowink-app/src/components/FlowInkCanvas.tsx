import { useEffect, useMemo, useRef } from "react";

import {
  CaptureUpdateAction,
  Excalidraw,
  MainMenu,
  type ElementRenderOverrides,
} from "@excalidraw/excalidraw";
import type {
  AppState,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import { sampleCamera, sampleTracks } from "@flowink/animation-core";

import {
  serializeScene,
  toExcalidrawElements,
  toExcalidrawInitialData,
} from "../services/scene";
import { sceneForEditor, sceneFromEditor } from "../services/sceneTheme";
import { getActiveSlide, useFlowInkStore } from "../stores/useFlowInkStore";

export const FlowInkCanvas = ({
  onApi,
  onCameraRotation,
}: {
  onApi: (api: ExcalidrawImperativeAPI | null) => void;
  onCameraRotation?: (rotation: number) => void;
}) => {
  const slide = useFlowInkStore(getActiveSlide);
  const mode = useFlowInkStore((state) => state.mode);
  const editorTheme = useFlowInkStore((state) => state.editorTheme);
  const setEditorTheme = useFlowInkStore((state) => state.setEditorTheme);
  const playhead = useFlowInkStore((state) => state.playhead);
  const updateActiveScene = useFlowInkStore((state) => state.updateActiveScene);
  const setSelectedElementIds = useFlowInkStore(
    (state) => state.setSelectedElementIds,
  );
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const appliedThemeRef = useRef(editorTheme);
  const initialData = useMemo(
    () => toExcalidrawInitialData(sceneForEditor(slide.scene, editorTheme)),
    [slide.id],
  );

  useEffect(() => {
    if (appliedThemeRef.current === editorTheme) return;
    const api = apiRef.current;
    if (!api) return;
    const source = getActiveSlide(useFlowInkStore.getState()).scene;
    const themed = sceneForEditor(source, editorTheme);
    api.updateScene({
      elements: toExcalidrawElements(themed.elements),
      appState: { ...api.getAppState(), ...themed.appState },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
    appliedThemeRef.current = editorTheme;
  }, [editorTheme, slide.id]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) {
      return;
    }
    if (mode !== "studio") {
      api.setElementRenderOverrides(null);
      onCameraRotation?.(0);
      return;
    }
    const samples = sampleTracks(
      slide.scene.elements,
      slide.timeline.tracks,
      playhead,
    );
    const overrides = new Map<
      string,
      { opacity: number; offset: { x: number; y: number } }
    >();
    for (const element of slide.scene.elements) {
      const sample = samples.get(element.id);
      if (!sample) {
        continue;
      }
      overrides.set(element.id, {
        opacity: sample.opacity,
        offset: { x: sample.x - element.x, y: sample.y - element.y },
      });
    }
    api.setElementRenderOverrides(overrides as ElementRenderOverrides);

    const camera = sampleCamera(slide.camera.keyframes, playhead);
    if (camera) {
      const state = api.getAppState();
      api.updateScene({
        appState: {
          scrollX: state.width / (2 * camera.zoom) - camera.x,
          scrollY: state.height / (2 * camera.zoom) - camera.y,
          zoom: { value: camera.zoom } as AppState["zoom"],
        },
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      onCameraRotation?.(camera.rotation);
    }
  }, [mode, onCameraRotation, playhead, slide]);

  useEffect(
    () => () => {
      onApi(null);
    },
    [onApi],
  );

  return (
    <Excalidraw
      initialData={initialData}
      theme={editorTheme}
      onThemeChange={(nextTheme) => {
        if (nextTheme === "light" || nextTheme === "dark") {
          setEditorTheme(nextTheme);
        }
      }}
      autoFocus
      onExcalidrawAPI={(api) => {
        apiRef.current = api;
        onApi(api);
      }}
      onChange={(elements, appState, files) => {
        if (appliedThemeRef.current !== editorTheme) return;
        const selected = Object.keys(appState.selectedElementIds).filter(
          (id) => appState.selectedElementIds[id],
        );
        setSelectedElementIds(selected);
        const source = getActiveSlide(useFlowInkStore.getState()).scene;
        updateActiveScene(
          sceneFromEditor(
            serializeScene(elements, appState, files),
            source,
            editorTheme,
          ),
        );
      }}
    >
      <MainMenu>
        <MainMenu.DefaultItems.LoadScene />
        <MainMenu.DefaultItems.SaveToActiveFile />
        <MainMenu.DefaultItems.Export />
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.CommandPalette />
        <MainMenu.DefaultItems.SearchMenu />
        <MainMenu.DefaultItems.Help />
        <MainMenu.DefaultItems.ClearCanvas />
        <MainMenu.Separator />
        <MainMenu.DefaultItems.Preferences />
        <MainMenu.DefaultItems.ToggleTheme allowSystemTheme={false} />
        <MainMenu.DefaultItems.ChangeCanvasBackground />
      </MainMenu>
    </Excalidraw>
  );
};
