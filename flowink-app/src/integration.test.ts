import { describe, expect, it } from "vitest";

import { createSlide } from "@flowink/project-schema";

import {
  loadLastProject,
  loadRecentProjects,
  saveProject,
} from "./services/persistence";
import { getActiveSlide, useFlowInkStore } from "./stores/useFlowInkStore";
import { createKodexDeck } from "./services/kodex";

describe("FlowInk MVP integration", () => {
  it("creates, duplicates, sequences, saves and reloads a project", async () => {
    const store = useFlowInkStore.getState();
    store.newProject("Integration story");
    useFlowInkStore.getState().setSelectedElementIds(["element-a"]);
    useFlowInkStore.getState().addStep({
      name: "Reveal architecture",
      effect: "enter",
      preset: "fade",
      duration: 0.6,
      delay: 0.1,
      easing: "ease-out",
    });
    useFlowInkStore.getState().duplicateActiveSlide();

    const beforeSave = useFlowInkStore.getState().project;
    expect(beforeSave.slides).toHaveLength(2);
    expect(beforeSave.slides[0].steps[0].animations[0].elementId).toBe(
      "element-a",
    );

    await saveProject(beforeSave);
    const reloaded = await loadLastProject();
    const recent = await loadRecentProjects();

    expect(reloaded?.metadata.title).toBe("Integration story");
    expect(reloaded?.slides).toHaveLength(2);
    expect(
      recent.some((project) => project.metadata.title === "Integration story"),
    ).toBe(true);
  });

  it("keeps the replacement slide active when applying a template", () => {
    useFlowInkStore.getState().newProject("Template identity");
    const replacement = createSlide("Template");

    useFlowInkStore.getState().replaceActiveSlide(replacement);

    expect(useFlowInkStore.getState().activeSlideId).toBe(replacement.id);
    expect(getActiveSlide(useFlowInkStore.getState()).id).toBe(replacement.id);
    expect(getActiveSlide(useFlowInkStore.getState()).name).toBe("Template");
  });

  it("does not publish store updates for an unchanged canvas state", () => {
    useFlowInkStore.getState().newProject("Stable canvas");
    useFlowInkStore.getState().setSelectedElementIds(["element-a"]);

    const beforeSelection = useFlowInkStore.getState();
    useFlowInkStore.getState().setSelectedElementIds(["element-a"]);
    expect(useFlowInkStore.getState()).toBe(beforeSelection);

    const beforeScene = useFlowInkStore.getState();
    useFlowInkStore
      .getState()
      .updateActiveScene(getActiveSlide(beforeScene).scene);
    expect(useFlowInkStore.getState()).toBe(beforeScene);
  });

  it("applies a Kodex deck as one undoable change", () => {
    useFlowInkStore.getState().newProject("Before Kodex");
    useFlowInkStore
      .getState()
      .applyKodexProject(createKodexDeck("AI agents", 4));

    expect(useFlowInkStore.getState().project.metadata.title).toBe("AI agents");
    expect(useFlowInkStore.getState().project.slides).toHaveLength(4);

    useFlowInkStore.getState().undoFlowInk();
    expect(useFlowInkStore.getState().project.metadata.title).toBe(
      "Before Kodex",
    );
  });
});
