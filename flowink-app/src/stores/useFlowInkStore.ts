import { create } from "zustand";

import {
  createId,
  createProject,
  createSlide,
  duplicateSlide,
  synchronizeElementMeta,
  touchProject,
  type AnimatableProperty,
  type AnimationPreset,
  type EasingName,
  type FlowInkAsset,
  type FlowInkCameraKeyframe,
  type FlowInkMode,
  type FlowInkProject,
  type FlowInkScene,
  type FlowInkSlide,
  type SlideTransitionType,
} from "@flowink/project-schema";

export interface StepDraft {
  name: string;
  effect: "enter" | "exit";
  preset: AnimationPreset;
  duration: number;
  delay: number;
  easing: EasingName;
}

interface FlowInkState {
  project: FlowInkProject;
  activeSlideId: string;
  mode: FlowInkMode;
  selectedElementIds: string[];
  playhead: number;
  isPlaying: boolean;
  loop: boolean;
  hydrated: boolean;
  saveStatus: "saved" | "saving" | "error";
  past: FlowInkProject[];
  future: FlowInkProject[];
  slideClipboard: FlowInkSlide | null;
  trackClipboard: FlowInkSlide["timeline"]["tracks"][number] | null;
  setHydrated: (hydrated: boolean) => void;
  setSaveStatus: (status: FlowInkState["saveStatus"]) => void;
  setProject: (project: FlowInkProject) => void;
  newProject: (title?: string) => void;
  renameProject: (title: string) => void;
  setMode: (mode: FlowInkMode) => void;
  setActiveSlide: (slideId: string) => void;
  setSelectedElementIds: (ids: string[]) => void;
  updateActiveScene: (scene: FlowInkScene) => void;
  addSlide: () => void;
  duplicateActiveSlide: () => void;
  deleteActiveSlide: () => void;
  renameActiveSlide: (name: string) => void;
  moveActiveSlide: (offset: -1 | 1) => void;
  copyActiveSlide: () => void;
  pasteSlide: () => void;
  addStep: (draft: StepDraft) => void;
  removeStep: (stepId: string) => void;
  updateStep: (stepId: string, draft: Partial<StepDraft>) => void;
  setTransition: (type: SlideTransitionType) => void;
  addCameraKeyframe: (keyframe: Omit<FlowInkCameraKeyframe, "id">) => void;
  removeCameraKeyframe: (keyframeId: string) => void;
  addTimelineKeyframe: (
    property: AnimatableProperty,
    time: number,
    value: number,
    easing: EasingName,
  ) => void;
  updateKeyframeTime: (
    trackId: string,
    keyframeId: string,
    time: number,
  ) => void;
  removeTrack: (trackId: string) => void;
  copyTrack: (trackId: string) => void;
  pasteTrack: () => void;
  setPlayhead: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  setLoop: (loop: boolean) => void;
  addAsset: (asset: FlowInkAsset) => void;
  replaceActiveSlide: (slide: FlowInkSlide) => void;
  undoFlowInk: () => void;
  redoFlowInk: () => void;
}

const clone = <T>(value: T): T => structuredClone(value);

const sceneSignature = (scene: FlowInkScene): string =>
  JSON.stringify({
    elements: scene.elements.map((element) => [
      element.id,
      element.version,
      element.versionNonce,
      element.isDeleted,
      element.x,
      element.y,
      element.width,
      element.height,
      element.angle,
      element.opacity,
    ]),
    appState: scene.appState,
    files: Object.entries(scene.files)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([id, value]) => {
        const file = value as Record<string, unknown>;
        const dataUrl = typeof file.dataURL === "string" ? file.dataURL : "";
        return [
          id,
          file.mimeType,
          file.created,
          file.lastRetrieved,
          dataUrl.length,
          dataUrl.slice(0, 64),
        ];
      }),
  });

const activeSlideIndex = (
  state: Pick<FlowInkState, "project" | "activeSlideId">,
) =>
  Math.max(
    0,
    state.project.slides.findIndex((slide) => slide.id === state.activeSlideId),
  );

export const getActiveSlide = (
  state: Pick<FlowInkState, "project" | "activeSlideId">,
): FlowInkSlide =>
  state.project.slides[activeSlideIndex(state)] ?? state.project.slides[0];

const baseProject = createProject("Technical story");

export const useFlowInkStore = create<FlowInkState>((set, get) => {
  const commit = (
    mutator: (project: FlowInkProject, state: FlowInkState) => void,
    recordHistory = true,
  ) => {
    set((state) => {
      const next = clone(state.project);
      mutator(next, state);
      return {
        project: touchProject(next),
        past: recordHistory
          ? [...state.past.slice(-49), clone(state.project)]
          : state.past,
        future: recordHistory ? [] : state.future,
        saveStatus: "saving" as const,
      };
    });
  };

  return {
    project: baseProject,
    activeSlideId: baseProject.slides[0].id,
    mode: "draw",
    selectedElementIds: [],
    playhead: 0,
    isPlaying: false,
    loop: false,
    hydrated: false,
    saveStatus: "saved",
    past: [],
    future: [],
    slideClipboard: null,
    trackClipboard: null,

    setHydrated: (hydrated) => set({ hydrated }),
    setSaveStatus: (saveStatus) => set({ saveStatus }),
    setProject: (project) =>
      set({
        project,
        activeSlideId: project.slides[0].id,
        selectedElementIds: [],
        playhead: 0,
        isPlaying: false,
        past: [],
        future: [],
        saveStatus: "saved",
      }),
    newProject: (title = "Untitled FlowInk") => {
      const project = createProject(title);
      set({
        project,
        activeSlideId: project.slides[0].id,
        selectedElementIds: [],
        playhead: 0,
        past: [],
        future: [],
        saveStatus: "saving",
      });
    },
    renameProject: (title) =>
      commit((project) => {
        project.metadata.title = title || "Untitled FlowInk";
      }),
    setMode: (mode) => set({ mode, isPlaying: false }),
    setActiveSlide: (activeSlideId) =>
      set({
        activeSlideId,
        selectedElementIds: [],
        playhead: 0,
        isPlaying: false,
      }),
    setSelectedElementIds: (selectedElementIds) =>
      set((state) =>
        state.selectedElementIds.length === selectedElementIds.length &&
        state.selectedElementIds.every(
          (elementId, index) => elementId === selectedElementIds[index],
        )
          ? state
          : { selectedElementIds },
      ),
    updateActiveScene: (scene) =>
      set((state) => {
        const index = activeSlideIndex(state);
        if (
          sceneSignature(state.project.slides[index].scene) ===
          sceneSignature(scene)
        ) {
          return state;
        }
        const project = clone(state.project);
        project.slides[index] = synchronizeElementMeta({
          ...project.slides[index],
          scene,
        });
        return {
          project: touchProject(project),
          saveStatus: "saving" as const,
        };
      }),
    addSlide: () => {
      const slide = createSlide(`Slide ${get().project.slides.length + 1}`);
      commit((project) => {
        project.slides.push(slide);
      });
      set({ activeSlideId: slide.id });
    },
    duplicateActiveSlide: () => {
      const state = get();
      const index = activeSlideIndex(state);
      const slide = duplicateSlide(state.project.slides[index]);
      commit((project) => {
        project.slides.splice(index + 1, 0, slide);
      });
      set({ activeSlideId: slide.id });
    },
    deleteActiveSlide: () => {
      const state = get();
      if (state.project.slides.length === 1) {
        return;
      }
      const index = activeSlideIndex(state);
      const fallback = state.project.slides[Math.max(0, index - 1)].id;
      commit((project) => {
        project.slides.splice(index, 1);
      });
      set({ activeSlideId: fallback });
    },
    renameActiveSlide: (name) =>
      commit((project, state) => {
        project.slides[activeSlideIndex(state)].name = name || "Untitled slide";
      }),
    moveActiveSlide: (offset) => {
      const state = get();
      const from = activeSlideIndex(state);
      const to = Math.min(
        state.project.slides.length - 1,
        Math.max(0, from + offset),
      );
      if (from === to) {
        return;
      }
      commit((project) => {
        const [slide] = project.slides.splice(from, 1);
        project.slides.splice(to, 0, slide);
      });
    },
    copyActiveSlide: () =>
      set({ slideClipboard: clone(getActiveSlide(get())) }),
    pasteSlide: () => {
      const clipboard = get().slideClipboard;
      if (!clipboard) {
        return;
      }
      const slide = duplicateSlide(clipboard, `${clipboard.name} pasted`);
      commit((project, state) => {
        project.slides.splice(activeSlideIndex(state) + 1, 0, slide);
      });
      set({ activeSlideId: slide.id });
    },
    addStep: (draft) => {
      const state = get();
      if (!state.selectedElementIds.length) {
        return;
      }
      commit((project, current) => {
        const slide = project.slides[activeSlideIndex(current)];
        slide.steps.push({
          id: createId("step"),
          name: draft.name || `Step ${slide.steps.length + 1}`,
          cameraKeyframeId: null,
          animations: current.selectedElementIds.map((elementId) => ({
            id: createId("animation"),
            elementId,
            effect: draft.effect,
            preset: draft.preset,
            duration: Math.max(0.05, draft.duration),
            delay: Math.max(0, draft.delay),
            easing: draft.easing,
          })),
        });
      });
    },
    removeStep: (stepId) =>
      commit((project, state) => {
        const slide = project.slides[activeSlideIndex(state)];
        slide.steps = slide.steps.filter((step) => step.id !== stepId);
      }),
    updateStep: (stepId, draft) =>
      commit((project, state) => {
        const step = project.slides[activeSlideIndex(state)].steps.find(
          (candidate) => candidate.id === stepId,
        );
        if (!step) {
          return;
        }
        if (draft.name !== undefined) {
          step.name = draft.name;
        }
        step.animations = step.animations.map((animation) => ({
          ...animation,
          ...(draft.effect !== undefined ? { effect: draft.effect } : {}),
          ...(draft.preset !== undefined ? { preset: draft.preset } : {}),
          ...(draft.duration !== undefined
            ? { duration: Math.max(0.05, draft.duration) }
            : {}),
          ...(draft.delay !== undefined
            ? { delay: Math.max(0, draft.delay) }
            : {}),
          ...(draft.easing !== undefined ? { easing: draft.easing } : {}),
        }));
      }),
    setTransition: (type) =>
      commit((project, state) => {
        project.slides[activeSlideIndex(state)].transition.type = type;
      }),
    addCameraKeyframe: (keyframe) =>
      commit((project, state) => {
        const slide = project.slides[activeSlideIndex(state)];
        slide.camera.keyframes.push({ ...keyframe, id: createId("camera") });
        slide.camera.keyframes.sort((a, b) => a.time - b.time);
      }),
    removeCameraKeyframe: (keyframeId) =>
      commit((project, state) => {
        const slide = project.slides[activeSlideIndex(state)];
        slide.camera.keyframes = slide.camera.keyframes.filter(
          (keyframe) => keyframe.id !== keyframeId,
        );
      }),
    addTimelineKeyframe: (property, time, value, easing) => {
      const state = get();
      if (!state.selectedElementIds.length) {
        return;
      }
      commit((project, current) => {
        const slide = project.slides[activeSlideIndex(current)];
        for (const elementId of current.selectedElementIds) {
          let track = slide.timeline.tracks.find(
            (candidate) =>
              candidate.elementId === elementId &&
              candidate.property === property,
          );
          if (!track) {
            track = {
              id: createId("track"),
              elementId,
              property,
              keyframes: [],
            };
            slide.timeline.tracks.push(track);
          }
          const existing = track.keyframes.find(
            (keyframe) => Math.abs(keyframe.time - time) < 0.001,
          );
          if (existing) {
            existing.value = value;
            existing.easing = easing;
          } else {
            track.keyframes.push({
              id: createId("keyframe"),
              time,
              value,
              easing,
            });
            track.keyframes.sort((a, b) => a.time - b.time);
          }
        }
      });
    },
    updateKeyframeTime: (trackId, keyframeId, time) =>
      commit((project, state) => {
        const track = project.slides[
          activeSlideIndex(state)
        ].timeline.tracks.find((candidate) => candidate.id === trackId);
        const keyframe = track?.keyframes.find(
          (candidate) => candidate.id === keyframeId,
        );
        if (track && keyframe) {
          keyframe.time = Math.max(
            0,
            Math.min(
              time,
              project.slides[activeSlideIndex(state)].timeline.duration,
            ),
          );
          track.keyframes.sort((a, b) => a.time - b.time);
        }
      }),
    removeTrack: (trackId) =>
      commit((project, state) => {
        const timeline = project.slides[activeSlideIndex(state)].timeline;
        timeline.tracks = timeline.tracks.filter(
          (track) => track.id !== trackId,
        );
      }),
    copyTrack: (trackId) => {
      const track = getActiveSlide(get()).timeline.tracks.find(
        (candidate) => candidate.id === trackId,
      );
      set({ trackClipboard: track ? clone(track) : null });
    },
    pasteTrack: () => {
      const clipboard = get().trackClipboard;
      const selected = get().selectedElementIds[0];
      if (!clipboard || !selected) {
        return;
      }
      commit((project, state) => {
        project.slides[activeSlideIndex(state)].timeline.tracks.push({
          ...clone(clipboard),
          id: createId("track"),
          elementId: selected,
          keyframes: clipboard.keyframes.map((keyframe) => ({
            ...keyframe,
            id: createId("keyframe"),
          })),
        });
      });
    },
    setPlayhead: (playhead) => set({ playhead }),
    setPlaying: (isPlaying) => set({ isPlaying }),
    setLoop: (loop) => set({ loop }),
    addAsset: (asset) =>
      commit((project) => {
        project.assets[asset.id] = asset;
      }),
    replaceActiveSlide: (slide) => {
      const replacement = synchronizeElementMeta(slide);
      commit((project, state) => {
        project.slides[activeSlideIndex(state)] = replacement;
      });
      set({ activeSlideId: replacement.id, selectedElementIds: [] });
    },
    undoFlowInk: () => {
      const state = get();
      const previous = state.past[state.past.length - 1];
      if (!previous) {
        return;
      }
      const activeId = previous.slides.some(
        (slide) => slide.id === state.activeSlideId,
      )
        ? state.activeSlideId
        : previous.slides[0].id;
      set({
        project: clone(previous),
        activeSlideId: activeId,
        past: state.past.slice(0, -1),
        future: [clone(state.project), ...state.future.slice(0, 49)],
        saveStatus: "saving",
      });
    },
    redoFlowInk: () => {
      const state = get();
      const next = state.future[0];
      if (!next) {
        return;
      }
      set({
        project: clone(next),
        activeSlideId: next.slides.some(
          (slide) => slide.id === state.activeSlideId,
        )
          ? state.activeSlideId
          : next.slides[0].id,
        past: [...state.past.slice(-49), clone(state.project)],
        future: state.future.slice(1),
        saveStatus: "saving",
      });
    },
  };
});
