import {
  createProject,
  duplicateSlide,
  synchronizeElementMeta,
} from "@flowink/project-schema";

import {
  firstPosition,
  nextPosition,
  previousPosition,
  sampleSmartTransition,
} from "./index";

describe("presentation core", () => {
  it("advances steps before changing slides", () => {
    const project = createProject();
    project.slides[0].steps = [
      { id: "one", name: "One", cameraKeyframeId: null, animations: [] },
    ];
    project.slides.push(duplicateSlide(project.slides[0], "Slide 2"));
    const step = nextPosition(project, firstPosition());
    expect(step).toEqual({ slideIndex: 0, stepIndex: 0 });
    expect(nextPosition(project, step)).toEqual({
      slideIndex: 1,
      stepIndex: -1,
    });
    expect(previousPosition(project, { slideIndex: 1, stepIndex: -1 })).toEqual(
      {
        slideIndex: 0,
        stepIndex: 0,
      },
    );
  });

  it("interpolates matched conceptual elements", () => {
    const project = createProject();
    project.slides[0].scene.elements = [
      {
        id: "box",
        type: "rectangle",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        angle: 0,
        opacity: 100,
      },
    ];
    project.slides[0] = synchronizeElementMeta(project.slides[0]);
    const next = duplicateSlide(project.slides[0]);
    next.transition = { type: "smart", duration: 1, easing: "linear" };
    next.scene.elements = [{ ...next.scene.elements[0], x: 200, width: 200 }];
    const sample = sampleSmartTransition(project.slides[0], next, 0.5);
    expect(sample[0]).toMatchObject({ x: 100, width: 150 });
  });
});
