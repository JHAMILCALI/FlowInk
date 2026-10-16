import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CaptureUpdateAction, Excalidraw } from "@excalidraw/excalidraw";
import type {
  AppState,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import { getStepDuration, sampleCamera } from "@flowink/animation-core";
import {
  buildSequenceScene,
  buildSmartTransitionScene,
} from "@flowink/player-runtime";
import {
  firstPosition,
  lastPosition,
  nextPosition,
  previousPosition,
  type PresentationPosition,
} from "@flowink/presentation-core";

import {
  toBinaryFiles,
  toExcalidrawInitialData,
  toExcalidrawElements,
} from "../services/scene";
import { useFlowInkStore } from "../stores/useFlowInkStore";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

const sequenceTime = (
  steps: ReturnType<
    typeof useFlowInkStore.getState
  >["project"]["slides"][number]["steps"],
  stepIndex: number,
  progress: number,
): number => {
  let time = 0;
  for (let index = 0; index < stepIndex; index++) {
    time += getStepDuration(steps[index]);
  }
  if (stepIndex >= 0 && steps[stepIndex]) {
    time += getStepDuration(steps[stepIndex]) * progress;
  }
  return time;
};

export const Presenter = ({
  navigate,
  obs = false,
  player = false,
}: {
  navigate: (path: string) => void;
  obs?: boolean;
  player?: boolean;
}) => {
  const project = useFlowInkStore((state) => state.project);
  const [position, setPosition] = useState<PresentationPosition>(firstPosition);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [cameraRotation, setCameraRotation] = useState(0);
  const [transitionClass, setTransitionClass] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef(0);
  const transitioningRef = useRef(false);
  const slide = project.slides[position.slideIndex] ?? project.slides[0];
  const initialData = useMemo(
    () => toExcalidrawInitialData(slide.scene),
    [slide.id],
  );

  const applyFrame = useCallback(
    (stepIndex: number, progress: number) => {
      if (!api) return;
      api.updateScene({
        elements: toExcalidrawElements(
          buildSequenceScene(slide, stepIndex, progress),
        ),
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      const camera = sampleCamera(
        slide.camera.keyframes,
        sequenceTime(slide.steps, stepIndex, progress),
      );
      if (camera) {
        const appState = api.getAppState();
        api.updateScene({
          appState: {
            scrollX: appState.width / (2 * camera.zoom) - camera.x,
            scrollY: appState.height / (2 * camera.zoom) - camera.y,
            zoom: { value: camera.zoom } as AppState["zoom"],
          },
          captureUpdate: CaptureUpdateAction.NEVER,
        });
        setCameraRotation(camera.rotation);
      }
    },
    [api, slide],
  );

  useEffect(() => {
    const ownerWindow = rootRef.current?.ownerDocument.defaultView;
    if (!ownerWindow) return;
    ownerWindow.cancelAnimationFrame(animationRef.current);
    if (!api) return;
    if (position.stepIndex < 0 || !slide.steps[position.stepIndex]) {
      applyFrame(position.stepIndex, 1);
      return;
    }
    const duration = getStepDuration(slide.steps[position.stepIndex]) * 1000;
    const start = ownerWindow.performance.now();
    const tick = (clock: number) => {
      const progress = Math.min(1, (clock - start) / duration);
      applyFrame(position.stepIndex, progress);
      if (progress < 1) {
        animationRef.current = ownerWindow.requestAnimationFrame(tick);
      }
    };
    animationRef.current = ownerWindow.requestAnimationFrame(tick);
    return () => ownerWindow.cancelAnimationFrame(animationRef.current);
  }, [api, applyFrame, position.stepIndex, slide.id]);

  const moveTo = useCallback(
    (target: PresentationPosition, direction: "forward" | "back") => {
      if (transitioningRef.current) return;
      if (target.slideIndex === position.slideIndex) {
        setPosition(target);
        return;
      }
      const targetSlide = project.slides[target.slideIndex];
      const type = targetSlide.transition.type;
      const ownerWindow = rootRef.current?.ownerDocument.defaultView;
      if (!ownerWindow) return;
      if (direction === "forward" && type === "smart" && api) {
        transitioningRef.current = true;
        api.addFiles(
          Object.values(
            toBinaryFiles({ ...slide.scene.files, ...targetSlide.scene.files }),
          ),
        );
        const start = ownerWindow.performance.now();
        const duration = Math.max(100, targetSlide.transition.duration * 1000);
        const tick = (clock: number) => {
          const progress = Math.min(1, (clock - start) / duration);
          api.updateScene({
            elements: toExcalidrawElements(
              buildSmartTransitionScene(slide, targetSlide, progress),
            ),
            captureUpdate: CaptureUpdateAction.NEVER,
          });
          if (progress < 1) {
            animationRef.current = ownerWindow.requestAnimationFrame(tick);
          } else {
            transitioningRef.current = false;
            setPosition(target);
          }
        };
        animationRef.current = ownerWindow.requestAnimationFrame(tick);
        return;
      }
      setTransitionClass(`fi-transition--${type}`);
      setPosition(target);
      ownerWindow.setTimeout(
        () => setTransitionClass(""),
        targetSlide.transition.duration * 1000,
      );
    },
    [api, position.slideIndex, project.slides, slide],
  );

  const next = useCallback(
    () => moveTo(nextPosition(project, position), "forward"),
    [moveTo, position, project],
  );
  const previous = useCallback(
    () => moveTo(previousPosition(project, position), "back"),
    [moveTo, position, project],
  );

  useEffect(() => {
    const ownerDocument = rootRef.current?.ownerDocument;
    const ownerWindow = ownerDocument?.defaultView;
    if (!ownerDocument || !ownerWindow) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === "Space" || event.key === "ArrowRight") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        if (ownerDocument.fullscreenElement) {
          void ownerDocument.exitFullscreen();
        } else {
          void rootRef.current?.requestFullscreen();
        }
      } else if (event.key === "Escape" && ownerDocument.fullscreenElement) {
        void ownerDocument.exitFullscreen();
      } else if (event.key === "Home") {
        event.preventDefault();
        setPosition(firstPosition());
      } else if (event.key === "End") {
        event.preventDefault();
        setPosition(lastPosition(project));
      }
    };
    ownerWindow.addEventListener("keydown", onKeyDown);
    return () => ownerWindow.removeEventListener("keydown", onKeyDown);
  }, [next, previous, project]);

  return (
    <div
      ref={rootRef}
      className={`fi-presenter ${obs ? "fi-presenter--obs" : ""} ${
        player ? "fi-presenter--player" : ""
      } ${transitionClass}`}
      style={{
        cursor: obs && !project.settings.showCursor ? "none" : undefined,
      }}
    >
      <div
        className="fi-presenter__stage"
        style={{ transform: `rotate(${-cameraRotation}rad) scale(1.01)` }}
      >
        <Excalidraw
          key={slide.id}
          initialData={initialData}
          theme="dark"
          ui={false}
          interaction={false}
          viewModeEnabled
          onExcalidrawAPI={setApi}
        />
      </div>

      {!obs && !player && (
        <>
          <button
            className="fi-presenter__exit"
            type="button"
            onClick={() => navigate("/editor")}
          >
            Exit
          </button>
          <button
            className="fi-presenter__previous"
            type="button"
            onClick={previous}
            aria-label="Previous"
          >
            <ChevronLeftIcon />
          </button>
          <button
            className="fi-presenter__next"
            type="button"
            onClick={next}
            aria-label="Next"
          >
            <ChevronRightIcon />
          </button>
          <div className="fi-presenter__hint">
            SPACE to advance · F fullscreen
          </div>
          <div className="fi-presenter__progress">
            <span>{String(position.slideIndex + 1).padStart(2, "0")}</span>
            <div>
              {project.slides.map((candidate, index) => (
                <button
                  type="button"
                  key={candidate.id}
                  aria-label={`Go to ${candidate.name}`}
                  className={index === position.slideIndex ? "is-active" : ""}
                  onClick={() =>
                    setPosition({ slideIndex: index, stepIndex: -1 })
                  }
                />
              ))}
            </div>
            <span>{String(project.slides.length).padStart(2, "0")}</span>
          </div>
          {slide.steps.length > 0 && (
            <div className="fi-presenter__steps">
              {slide.steps.map((step, index) => (
                <span
                  key={step.id}
                  className={index <= position.stepIndex ? "is-complete" : ""}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
