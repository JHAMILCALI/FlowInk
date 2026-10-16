import { useEffect, useState } from "react";

import type { FlowInkProject } from "@flowink/project-schema";
import { Button, EmptyState } from "@flowink/ui";

import { loadRecentProjects } from "../services/persistence";
import { useFlowInkStore } from "../stores/useFlowInkStore";
import { LayersIcon, PlusIcon } from "./Icons";

export const RecentProjects = ({ onClose }: { onClose: () => void }) => {
  const [projects, setProjects] = useState<FlowInkProject[] | null>(null);
  const setProject = useFlowInkStore((state) => state.setProject);
  const newProject = useFlowInkStore((state) => state.newProject);

  useEffect(() => {
    void loadRecentProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  return (
    <div
      className="fi-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="fi-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Recent FlowInk projects"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <span>
            <LayersIcon /> Recent projects
          </span>
          <button type="button" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="fi-recent-projects">
          {projects === null ? (
            <span className="fi-loader">Loading…</span>
          ) : projects.length ? (
            projects.map((project) => (
              <button
                key={project.metadata.createdAt}
                type="button"
                onClick={() => {
                  setProject(project);
                  onClose();
                }}
              >
                <span className="fi-recent-projects__preview">
                  {project.slides.length}
                </span>
                <span>
                  <strong>{project.metadata.title}</strong>
                  <small>
                    {project.slides.length} slide(s) ·{" "}
                    {new Date(project.metadata.updatedAt).toLocaleString()}
                  </small>
                </span>
              </button>
            ))
          ) : (
            <EmptyState icon={<LayersIcon />} title="No saved projects">
              Your local projects will appear here after autosave.
            </EmptyState>
          )}
        </div>
        <footer>
          <Button
            variant="primary"
            onClick={() => {
              newProject();
              onClose();
            }}
          >
            <PlusIcon /> New project
          </Button>
        </footer>
      </section>
    </div>
  );
};
