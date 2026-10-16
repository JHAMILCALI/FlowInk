import { easing, interpolate } from "@flowink/animation-core";
import type {
  FlowInkElementMeta,
  FlowInkProject,
  FlowInkSceneElement,
  FlowInkSlide,
} from "@flowink/project-schema";

export interface PresentationPosition {
  slideIndex: number;
  stepIndex: number;
}

export interface SmartTransitionPair {
  flowinkId: string;
  from: FlowInkSceneElement | null;
  to: FlowInkSceneElement | null;
}

export const firstPosition = (): PresentationPosition => ({
  slideIndex: 0,
  stepIndex: -1,
});

export const lastPosition = (project: FlowInkProject): PresentationPosition => {
  const slideIndex = Math.max(0, project.slides.length - 1);
  return {
    slideIndex,
    stepIndex: Math.max(
      -1,
      (project.slides[slideIndex]?.steps.length ?? 0) - 1,
    ),
  };
};

export const nextPosition = (
  project: FlowInkProject,
  current: PresentationPosition,
): PresentationPosition => {
  const slide = project.slides[current.slideIndex];
  if (!slide) {
    return firstPosition();
  }
  if (current.stepIndex < slide.steps.length - 1) {
    return { ...current, stepIndex: current.stepIndex + 1 };
  }
  if (current.slideIndex < project.slides.length - 1) {
    return { slideIndex: current.slideIndex + 1, stepIndex: -1 };
  }
  return current;
};

export const previousPosition = (
  project: FlowInkProject,
  current: PresentationPosition,
): PresentationPosition => {
  if (current.stepIndex >= 0) {
    return { ...current, stepIndex: current.stepIndex - 1 };
  }
  if (current.slideIndex > 0) {
    const slideIndex = current.slideIndex - 1;
    return {
      slideIndex,
      stepIndex: Math.max(-1, project.slides[slideIndex].steps.length - 1),
    };
  }
  return current;
};

const elementsByFlowInkId = (
  slide: FlowInkSlide,
): Map<string, FlowInkSceneElement> => {
  const byId = new Map(
    slide.scene.elements.map((element) => [element.id, element]),
  );
  const result = new Map<string, FlowInkSceneElement>();
  Object.entries(slide.elementMeta).forEach(([elementId, meta]) => {
    const element = byId.get(elementId);
    if (element) {
      result.set(meta.flowinkId, element);
    }
  });
  return result;
};

export const matchSmartTransitionElements = (
  fromSlide: FlowInkSlide,
  toSlide: FlowInkSlide,
): SmartTransitionPair[] => {
  const from = elementsByFlowInkId(fromSlide);
  const to = elementsByFlowInkId(toSlide);
  const ids = new Set([...from.keys(), ...to.keys()]);
  return [...ids].map((flowinkId) => ({
    flowinkId,
    from: from.get(flowinkId) ?? null,
    to: to.get(flowinkId) ?? null,
  }));
};

const cloneAtProgress = (
  pair: SmartTransitionPair,
  progress: number,
): FlowInkSceneElement | null => {
  if (!pair.from && !pair.to) {
    return null;
  }
  if (!pair.from && pair.to) {
    return { ...pair.to, opacity: interpolate(0, pair.to.opacity, progress) };
  }
  if (pair.from && !pair.to) {
    return {
      ...pair.from,
      opacity: interpolate(pair.from.opacity, 0, progress),
    };
  }

  const from = pair.from as FlowInkSceneElement;
  const to = pair.to as FlowInkSceneElement;
  if (from.type !== to.type) {
    return progress < 0.5
      ? { ...from, opacity: interpolate(from.opacity, 0, progress * 2) }
      : { ...to, opacity: interpolate(0, to.opacity, (progress - 0.5) * 2) };
  }
  return {
    ...to,
    id: from.id,
    x: interpolate(from.x, to.x, progress),
    y: interpolate(from.y, to.y, progress),
    width: interpolate(from.width, to.width, progress),
    height: interpolate(from.height, to.height, progress),
    angle: interpolate(from.angle, to.angle, progress),
    opacity: interpolate(from.opacity, to.opacity, progress),
  };
};

export const sampleSmartTransition = (
  fromSlide: FlowInkSlide,
  toSlide: FlowInkSlide,
  rawProgress: number,
): FlowInkSceneElement[] => {
  const progress = easing(toSlide.transition.easing, rawProgress);
  return matchSmartTransitionElements(fromSlide, toSlide)
    .map((pair) => cloneAtProgress(pair, progress))
    .filter((element): element is FlowInkSceneElement => element !== null);
};

export const ensureElementMeta = (
  elements: readonly FlowInkSceneElement[],
  meta: Record<string, FlowInkElementMeta>,
): boolean => elements.every((element) => Boolean(meta[element.id]));
