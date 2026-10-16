import {
  exportToBlob,
  exportToCanvas,
  exportToSvg,
} from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";
import { getStepDuration } from "@flowink/animation-core";
import { recordCanvas } from "@flowink/export-runtime";
import {
  buildSequenceScene,
  buildTimelineScene,
} from "@flowink/player-runtime";
import type { FlowInkProject, FlowInkSlide } from "@flowink/project-schema";

import { downloadBlob } from "./files";
import { toBinaryFiles, toExcalidrawElements } from "./scene";

const safeFileName = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "flowink-slide";

export const exportStill = async (
  api: ExcalidrawImperativeAPI,
  title: string,
  type: "png" | "svg",
): Promise<void> => {
  const elements = api.getSceneElements();
  const files = api.getFiles();
  const appState = {
    ...api.getAppState(),
    exportBackground: true,
    exportWithDarkMode: true,
    exportScale: 2,
  };
  if (type === "png") {
    const blob = await exportToBlob({
      elements,
      files,
      appState,
      mimeType: "image/png",
    });
    downloadBlob(blob, `${safeFileName(title)}.png`);
    return;
  }
  const svg = await exportToSvg({ elements, files, appState });
  downloadBlob(
    new Blob([svg.outerHTML], { type: "image/svg+xml" }),
    `${safeFileName(title)}.svg`,
  );
};

const getSequenceDuration = (slide: FlowInkSlide): number =>
  slide.steps.reduce((sum, step) => sum + getStepDuration(step), 0);

const sequencePositionAt = (
  slide: FlowInkSlide,
  time: number,
): { stepIndex: number; progress: number } => {
  let cursor = 0;
  for (let index = 0; index < slide.steps.length; index++) {
    const duration = getStepDuration(slide.steps[index]);
    if (time <= cursor + duration) {
      return { stepIndex: index, progress: (time - cursor) / duration };
    }
    cursor += duration;
  }
  return { stepIndex: Math.max(-1, slide.steps.length - 1), progress: 1 };
};

export const exportSlideVideo = async ({
  project,
  slide,
  format,
  onProgress,
  signal,
}: {
  project: FlowInkProject;
  slide: FlowInkSlide;
  format: "webm" | "mp4";
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}): Promise<void> => {
  const width = project.settings.width;
  const height = project.settings.height;
  const fps = project.settings.fps;
  const sequenceDuration = getSequenceDuration(slide);
  const duration = slide.timeline.tracks.length
    ? slide.timeline.duration
    : Math.max(sequenceDuration, 1);
  const mimeType =
    format === "mp4" ? "video/mp4;codecs=avc1.42E01E" : "video/webm;codecs=vp9";
  const target = document.createElement("canvas");
  target.width = width;
  target.height = height;
  const context = target.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is unavailable.");
  }

  const blob = await recordCanvas({
    canvas: target,
    duration,
    fps,
    mimeType,
    signal,
    onProgress,
    renderFrame: async (frame) => {
      const flowElements = slide.timeline.tracks.length
        ? buildTimelineScene(slide, frame.time)
        : (() => {
            const position = sequencePositionAt(slide, frame.time);
            return buildSequenceScene(
              slide,
              position.stepIndex,
              position.progress,
            );
          })();
      const rendered = await exportToCanvas({
        elements: toExcalidrawElements(flowElements).filter(
          (element) => !element.isDeleted,
        ) as readonly NonDeletedExcalidrawElement[],
        files: toBinaryFiles(slide.scene.files),
        appState: {
          ...slide.scene.appState,
          exportBackground: true,
          exportWithDarkMode: true,
          viewBackgroundColor: "#0b100d",
        },
        getDimensions: () => ({ width, height }),
      });
      context.clearRect(0, 0, width, height);
      context.drawImage(rendered, 0, 0, width, height);
    },
  });
  downloadBlob(blob, `${safeFileName(slide.name)}.${format}`);
};
