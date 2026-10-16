import { useCallback, useEffect, useRef, useState } from "react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import { saveProject } from "../services/persistence";
import { getActiveSlide, useFlowInkStore } from "../stores/useFlowInkStore";
import { FlowInkCanvas } from "./FlowInkCanvas";
import { SequencePanel } from "./SequencePanel";
import { SlideStrip } from "./SlideStrip";
import { StudioTimeline } from "./StudioTimeline";
import { TechnicalPanel } from "./TechnicalPanel";
import { ToolRail } from "./ToolRail";
import { TopBar } from "./TopBar";

export const EditorShell = ({
  navigate,
}: {
  navigate: (path: string) => void;
}) => {
  const mode = useFlowInkStore((state) => state.mode);
  const slide = useFlowInkStore(getActiveSlide);
  const project = useFlowInkStore((state) => state.project);
  const setSaveStatus = useFlowInkStore((state) => state.setSaveStatus);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [cameraRotation, setCameraRotation] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const handleApi = useCallback(
    (next: ExcalidrawImperativeAPI | null) => setApi(next),
    [],
  );

  useEffect(() => {
    const ownerWindow = rootRef.current?.ownerDocument.defaultView;
    if (!ownerWindow) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        setSaveStatus("saving");
        void saveProject(project)
          .then(() => setSaveStatus("saved"))
          .catch(() => setSaveStatus("error"));
      }
    };
    ownerWindow.addEventListener("keydown", onKeyDown);
    return () => ownerWindow.removeEventListener("keydown", onKeyDown);
  }, [project, setSaveStatus]);

  return (
    <div ref={rootRef} className={`fi-app fi-mode-${mode}`}>
      <TopBar api={api} navigate={navigate} />
      <main className="fi-workspace">
        <ToolRail api={api} />
        <section className="fi-editor-area">
          <div className="fi-stage-shell">
            <div className="fi-stage-meta">
              <span>{slide.name}</span>
              <span>1920 × 1080 · 16:9</span>
            </div>
            <div className="fi-stage-frame">
              <div
                className="fi-stage-camera"
                style={{
                  transform: `rotate(${-cameraRotation}rad) scale(1.005)`,
                }}
              >
                <FlowInkCanvas
                  key={slide.id}
                  onApi={handleApi}
                  onCameraRotation={setCameraRotation}
                />
              </div>
            </div>
          </div>
          {mode === "studio" && <StudioTimeline />}
        </section>
        {mode === "draw" && <TechnicalPanel api={api} />}
        {mode === "sequence" && <SequencePanel api={api} />}
      </main>
      <SlideStrip />
    </div>
  );
};
