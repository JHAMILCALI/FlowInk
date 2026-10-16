import {
  FLOWINK_FORMAT_VERSION,
  createProject,
  duplicateSlide,
  migrateProject,
  parseProject,
  serializeProject,
  synchronizeElementMeta,
} from "./index";

describe("FlowInk project schema", () => {
  it("creates a versioned 16:9 project", () => {
    const project = createProject("OAuth explained");
    expect(project.formatVersion).toBe(FLOWINK_FORMAT_VERSION);
    expect(project.settings).toMatchObject({
      width: 1920,
      height: 1080,
      fps: 30,
    });
    expect(project.slides).toHaveLength(1);
  });

  it("round-trips a project", () => {
    const project = createProject();
    expect(parseProject(serializeProject(project))).toEqual(project);
  });

  it("keeps conceptual identity when a slide is duplicated", () => {
    const source = createProject().slides[0];
    source.scene = {
      ...source.scene,
      elements: [
        {
          id: "rect",
          type: "rectangle",
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          angle: 0,
          opacity: 100,
        },
      ],
    };
    const synced = synchronizeElementMeta(source);
    const clone = duplicateSlide(synced);
    expect(clone.id).not.toBe(synced.id);
    expect(clone.elementMeta.rect.flowinkId).toBe(
      synced.elementMeta.rect.flowinkId,
    );
    expect(clone.elementMeta.rect.sourceId).toBe("rect");
  });

  it("migrates a legacy v0 project explicitly", () => {
    const current = createProject();
    const { formatVersion: _formatVersion, ...legacy } = current;
    const migrated = migrateProject({ ...legacy, version: 0 });
    expect(migrated.formatVersion).toBe(1);
  });

  it("rejects future versions", () => {
    expect(() =>
      migrateProject({ ...createProject(), formatVersion: 99 }),
    ).toThrow(/unsupported format version/i);
  });
});
