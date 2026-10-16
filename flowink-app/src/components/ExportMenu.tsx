import { useRef, useState } from "react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { Button } from "@flowink/ui";

import { downloadProject } from "../services/files";
import { exportSlideVideo, exportStill } from "../services/export";
import { getActiveSlide, useFlowInkStore } from "../stores/useFlowInkStore";
import { ExportIcon } from "./Icons";

export const ExportMenu = ({
  api,
  onClose,
}: {
  api: ExcalidrawImperativeAPI | null;
  onClose: () => void;
}) => {
  const project = useFlowInkStore((state) => state.project);
  const slide = useFlowInkStore(getActiveSlide);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = async (operation: () => Promise<void>) => {
    setError(null);
    try {
      await operation();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Export failed.");
    }
  };

  const video = (format: "webm" | "mp4") => {
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);
    void run(() =>
      exportSlideVideo({
        project,
        slide,
        format,
        signal: controller.signal,
        onProgress: setProgress,
      }),
    ).finally(() => {
      setProgress(null);
      abortRef.current = null;
    });
  };

  return (
    <div
      className="fi-popover fi-export-menu"
      role="dialog"
      aria-label="Export FlowInk"
    >
      <header>
        <span>
          <ExportIcon /> Export
        </span>
        <button type="button" onClick={onClose}>
          ×
        </button>
      </header>
      <p>
        Still image or animated output from <strong>{slide.name}</strong>.
      </p>
      <div className="fi-export-grid">
        <button
          type="button"
          disabled={!api || progress !== null}
          onClick={() =>
            api && void run(() => exportStill(api, slide.name, "png"))
          }
        >
          <strong>PNG</strong>
          <span>2× raster image</span>
        </button>
        <button
          type="button"
          disabled={!api || progress !== null}
          onClick={() =>
            api && void run(() => exportStill(api, slide.name, "svg"))
          }
        >
          <strong>SVG</strong>
          <span>Editable vector</span>
        </button>
        <button
          type="button"
          disabled={progress !== null}
          onClick={() => video("webm")}
        >
          <strong>WebM</strong>
          <span>{project.settings.fps} FPS video</span>
        </button>
        <button
          type="button"
          disabled={progress !== null}
          onClick={() => video("mp4")}
        >
          <strong>MP4</strong>
          <span>When browser supports H.264</span>
        </button>
        <button
          type="button"
          disabled={progress !== null}
          onClick={() => downloadProject(project)}
        >
          <strong>.flowink</strong>
          <span>Editable project</span>
        </button>
      </div>
      {progress !== null && (
        <div className="fi-export-progress">
          <progress value={progress} max="1" />
          <span>{Math.round(progress * 100)}%</span>
          <Button variant="danger" onClick={() => abortRef.current?.abort()}>
            Cancel
          </Button>
        </div>
      )}
      {error && <div className="fi-callout fi-callout--danger">{error}</div>}
    </div>
  );
};
