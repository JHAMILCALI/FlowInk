import { useRef, useState } from "react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { FlowInkMode } from "@flowink/project-schema";
import { Button, IconButton } from "@flowink/ui";

import { downloadProject, importProjectFile } from "../services/files";
import { saveProject } from "../services/persistence";
import { useFlowInkStore } from "../stores/useFlowInkStore";
import { ExportMenu } from "./ExportMenu";
import {
  DownloadIcon,
  ExportIcon,
  FolderIcon,
  PresentIcon,
  RedoIcon,
  SaveIcon,
  SparkIcon,
  UndoIcon,
} from "./Icons";
import { RecentProjects } from "./RecentProjects";

const modes: { id: FlowInkMode; label: string }[] = [
  { id: "draw", label: "DRAW" },
  { id: "sequence", label: "SEQUENCE" },
  { id: "studio", label: "STUDIO" },
];

export const TopBar = ({
  api,
  navigate,
  showTechnicalPanel,
  onToggleTechnicalPanel,
}: {
  api: ExcalidrawImperativeAPI | null;
  navigate: (path: string) => void;
  showTechnicalPanel: boolean;
  onToggleTechnicalPanel: () => void;
}) => {
  const project = useFlowInkStore((state) => state.project);
  const mode = useFlowInkStore((state) => state.mode);
  const saveStatus = useFlowInkStore((state) => state.saveStatus);
  const setMode = useFlowInkStore((state) => state.setMode);
  const setProject = useFlowInkStore((state) => state.setProject);
  const renameProject = useFlowInkStore((state) => state.renameProject);
  const setSaveStatus = useFlowInkStore((state) => state.setSaveStatus);
  const undo = useFlowInkStore((state) => state.undoFlowInk);
  const redo = useFlowInkStore((state) => state.redoFlowInk);
  const canUndo = useFlowInkStore((state) => state.past.length > 0);
  const canRedo = useFlowInkStore((state) => state.future.length > 0);
  const importInput = useRef<HTMLInputElement>(null);
  const [showExport, setShowExport] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  return (
    <header className="fi-topbar">
      <div className="fi-topbar__left">
        <button
          type="button"
          className="fi-wordmark"
          title="Recent projects"
          onClick={() => setShowRecent(true)}
        >
          <span>
            <SparkIcon />
          </span>
          <strong>FLOWINK</strong>
          <small>BETA</small>
        </button>
        <span className="fi-topbar__separator" />
        <div className="fi-project-meta">
          <span className="fi-project-meta__label">Project</span>
          <input
            key={project.metadata.title}
            className="fi-project-title"
            aria-label="Project title"
            defaultValue={project.metadata.title}
            onBlur={(event) => renameProject(event.target.value)}
            onKeyDown={(event) =>
              event.key === "Enter" && event.currentTarget.blur()
            }
          />
        </div>
        <div className="fi-save-state" data-state={saveStatus}>
          <span />
          {saveStatus === "saved"
            ? "Saved"
            : saveStatus === "saving"
            ? "Saving…"
            : "Save failed"}
        </div>
      </div>

      <nav className="fi-mode-switch" aria-label="Workspace mode">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={mode === item.id ? "is-active" : ""}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="fi-topbar__right">
        {mode === "draw" && (
          <Button
            variant="ghost"
            className={`fi-blocks-button ${
              showTechnicalPanel ? "is-active" : ""
            }`}
            onClick={onToggleTechnicalPanel}
            aria-pressed={showTechnicalPanel}
            title="Blocks and templates"
          >
            <SparkIcon /> <span>Blocks & templates</span>
          </Button>
        )}
        <div className="fi-topbar__group fi-topbar__history">
          <IconButton
            label="Undo FlowInk change"
            icon={<UndoIcon />}
            disabled={!canUndo}
            onClick={undo}
          />
          <IconButton
            label="Redo FlowInk change"
            icon={<RedoIcon />}
            disabled={!canRedo}
            onClick={redo}
          />
        </div>
        <input
          hidden
          ref={importInput}
          type="file"
          accept=".flowink,application/json"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            const ownerWindow = event.currentTarget.ownerDocument.defaultView;
            if (file) {
              void importProjectFile(file)
                .then(setProject)
                .catch((error: unknown) =>
                  ownerWindow?.alert(
                    error instanceof Error ? error.message : "Import failed",
                  ),
                );
            }
            event.currentTarget.value = "";
          }}
        />
        <div className="fi-topbar__group fi-topbar__files">
          <Button
            variant="ghost"
            className="fi-topbar__text-action"
            onClick={() => importInput.current?.click()}
            aria-label="Open project"
            title="Open project"
          >
            <FolderIcon /> <span>Open</span>
          </Button>
          <Button
            variant="ghost"
            className="fi-topbar__text-action"
            aria-label="Save project locally"
            title="Save project locally"
            onClick={() => {
              setSaveStatus("saving");
              void saveProject(project)
                .then(() => setSaveStatus("saved"))
                .catch(() => setSaveStatus("error"));
            }}
          >
            <SaveIcon /> <span>Save</span>
          </Button>
        </div>
        <div className="fi-topbar__group fi-topbar__publish">
          <div className="fi-menu-anchor">
            <Button
              variant="secondary"
              onClick={() => setShowExport((value) => !value)}
              aria-expanded={showExport}
              title="Export"
            >
              <ExportIcon /> <span>Export</span>
            </Button>
            {showExport && (
              <ExportMenu api={api} onClose={() => setShowExport(false)} />
            )}
          </div>
          <Button
            variant="primary"
            title="Present"
            onClick={() => navigate("/present")}
          >
            <PresentIcon /> <span>Present</span>
          </Button>
          <button
            type="button"
            className="fi-obs-button"
            title="Open OBS output"
            onClick={() => navigate("/obs")}
          >
            <span className="fi-obs-button__dot" /> OBS
          </button>
          <IconButton
            label="Download .flowink project"
            icon={<DownloadIcon />}
            className="fi-project-download"
            onClick={() => downloadProject(project)}
          />
        </div>
      </div>
      {showRecent && <RecentProjects onClose={() => setShowRecent(false)} />}
    </header>
  );
};
