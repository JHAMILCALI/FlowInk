import { useState } from "react";

import { Button, IconButton } from "@flowink/ui";

import { getActiveSlide, useFlowInkStore } from "../stores/useFlowInkStore";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  MoreIcon,
  PlusIcon,
  TrashIcon,
} from "./Icons";

const MiniScene = ({ slideId }: { slideId: string }) => {
  const slide = useFlowInkStore((state) =>
    state.project.slides.find((candidate) => candidate.id === slideId),
  );
  if (!slide || !slide.scene.elements.length) {
    return (
      <span className="fi-slide-thumb__empty">
        <span className="fi-slide-thumb__empty-mark" aria-hidden="true" />
        <span>Blank canvas</span>
      </span>
    );
  }
  const elements = slide.scene.elements.slice(0, 12);
  const minX = Math.min(...elements.map((element) => element.x));
  const minY = Math.min(...elements.map((element) => element.y));
  const maxX = Math.max(
    ...elements.map((element) => element.x + element.width),
  );
  const maxY = Math.max(
    ...elements.map((element) => element.y + element.height),
  );
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return (
    <svg viewBox={`${minX - 20} ${minY - 20} ${width + 40} ${height + 40}`}>
      {elements.map((element) =>
        element.type === "ellipse" ? (
          <ellipse
            key={element.id}
            cx={element.x + element.width / 2}
            cy={element.y + element.height / 2}
            rx={element.width / 2}
            ry={element.height / 2}
          />
        ) : (
          <rect
            key={element.id}
            x={element.x}
            y={element.y}
            width={Math.max(2, element.width)}
            height={Math.max(2, element.height)}
            rx="8"
          />
        ),
      )}
    </svg>
  );
};

export const SlideStrip = () => {
  const project = useFlowInkStore((state) => state.project);
  const active = useFlowInkStore(getActiveSlide);
  const setActiveSlide = useFlowInkStore((state) => state.setActiveSlide);
  const addSlide = useFlowInkStore((state) => state.addSlide);
  const duplicate = useFlowInkStore((state) => state.duplicateActiveSlide);
  const remove = useFlowInkStore((state) => state.deleteActiveSlide);
  const move = useFlowInkStore((state) => state.moveActiveSlide);
  const rename = useFlowInkStore((state) => state.renameActiveSlide);
  const copy = useFlowInkStore((state) => state.copyActiveSlide);
  const paste = useFlowInkStore((state) => state.pasteSlide);
  const hasClipboard = useFlowInkStore((state) =>
    Boolean(state.slideClipboard),
  );
  const [expanded, setExpanded] = useState(false);
  const activeIndex = project.slides.findIndex(
    (slide) => slide.id === active.id,
  );

  return (
    <footer className={`fi-slide-strip ${expanded ? "is-expanded" : ""}`}>
      <div className="fi-slide-strip__toolbar">
        <div className="fi-slide-strip__heading">
          <span>Slides</span>
          <strong>{project.slides.length}</strong>
          <small>
            {String(activeIndex + 1).padStart(2, "0")} /{" "}
            {String(project.slides.length).padStart(2, "0")}
          </small>
        </div>
        <div className="fi-slide-strip__controls">
          <div className="fi-slide-strip__actions">
            <Button
              variant="primary"
              onClick={addSlide}
              title="Add a new slide"
            >
              <PlusIcon /> <span>New slide</span>
            </Button>
            <Button
              variant="ghost"
              onClick={duplicate}
              title="Duplicate selected slide"
            >
              <CopyIcon /> <span>Duplicate</span>
            </Button>
            <span className="fi-slide-strip__divider" aria-hidden="true" />
            <IconButton
              label="Move slide left"
              icon={<ChevronLeftIcon />}
              onClick={() => move(-1)}
              disabled={activeIndex <= 0}
            />
            <IconButton
              label="Move slide right"
              icon={<ChevronRightIcon />}
              onClick={() => move(1)}
              disabled={activeIndex >= project.slides.length - 1}
            />
            <IconButton
              label="Delete selected slide"
              icon={<TrashIcon />}
              className="fi-slide-strip__delete"
              onClick={remove}
              disabled={project.slides.length === 1}
            />
          </div>
          <div className="fi-slide-strip__more">
            <IconButton label="Copy slide" icon={<CopyIcon />} onClick={copy} />
            <Button
              variant="ghost"
              onClick={paste}
              disabled={!hasClipboard}
              title="Paste copied slide"
            >
              Paste
            </Button>
            <IconButton
              label={expanded ? "Smaller thumbnails" : "Larger thumbnails"}
              icon={<MoreIcon />}
              active={expanded}
              onClick={() => setExpanded((value) => !value)}
            />
          </div>
        </div>
      </div>
      <div className="fi-slide-strip__list" role="tablist" aria-label="Slides">
        {project.slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={slide.id === active.id}
            className={`fi-slide-thumb ${
              slide.id === active.id ? "is-active" : ""
            }`}
            onClick={() => setActiveSlide(slide.id)}
            onKeyDown={(event) => {
              const offset =
                event.key === "ArrowRight"
                  ? 1
                  : event.key === "ArrowLeft"
                  ? -1
                  : 0;
              const nextIndex =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                  ? project.slides.length - 1
                  : index + offset;
              if (
                nextIndex === index ||
                nextIndex < 0 ||
                nextIndex >= project.slides.length
              )
                return;
              event.preventDefault();
              setActiveSlide(project.slides[nextIndex].id);
              const tabs =
                event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                  '[role="tab"]',
                );
              tabs?.[nextIndex]?.focus();
            }}
            onDoubleClick={(event) => {
              const next =
                event.currentTarget.ownerDocument.defaultView?.prompt(
                  "Slide name",
                  slide.name,
                );
              if (next != null) {
                setActiveSlide(slide.id);
                rename(next);
              }
            }}
          >
            <span className="fi-slide-thumb__number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="fi-slide-thumb__preview">
              <MiniScene slideId={slide.id} />
            </span>
            <span className="fi-slide-thumb__name">{slide.name}</span>
          </button>
        ))}
      </div>
    </footer>
  );
};
