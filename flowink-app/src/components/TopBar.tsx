import { useRef, useState } from "react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { FlowInkMode } from "@flowink/project-schema";
import { Button, IconButton } from "@flowink/ui";

import { downloadProject, importProjectFile } from "../services/files";
import { saveProject } from "../services/persistence";
import { useFlowInkStore } from "../stores/useFlowInkStore";
import { ExportMenu } from "./ExportMenu";
import {
  ExportIcon,
  PresentIcon,
  RedoIcon,
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
}: {
  api: ExcalidrawImperativeAPI | null;
  navigate: (path: string) => void;
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
      <button
        type="button"
        className="fi-wordmark"
        onClick={() => setShowRecent(true)}
      >
        <span>
          <SparkIcon />
        </span>
        <strong>FLOWINK</strong>
        <small>BETA</small>
      </button>
      <span className="fi-topbar__separator" />
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
      <div className="fi-save-state" data-state={saveStatus}>
        <span />{" "}
        {saveStatus === "saved"
          ? "Saved locally"
          : saveStatus === "saving"
          ? "Saving…"
          : "Save failed"}
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
        <input
          hidden
          ref={importInput}
          type="file"
          accept=".flowink,application/json"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) {
              void importProjectFile(file)
                .then(setProject)
                .catch((error: unknown) =>
                  window.alert(
                    error instanceof Error ? error.message : "Import failed",
                  ),
                );
            }
            event.currentTarget.value = "";
          }}
        />
        <Button variant="ghost" onClick={() => importInput.current?.click()}>
          Open
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setSaveStatus("saving");
            void saveProject(project)
              .then(() => setSaveStatus("saved"))
              .catch(() => setSaveStatus("error"));
          }}
        >
          Save
        </Button>
        <div className="fi-menu-anchor">
          <Button
            variant="secondary"
            onClick={() => setShowExport((value) => !value)}
          >
            <ExportIcon /> Export
          </Button>
          {showExport && (
            <ExportMenu api={api} onClose={() => setShowExport(false)} />
          )}
        </div>
        <Button variant="primary" onClick={() => navigate("/present")}>
          <PresentIcon /> Present
        </Button>
        <button
          type="button"
          className="fi-obs-button"
          onClick={() => navigate("/obs")}
        >
          OBS
        </button>
        <button
          type="button"
          className="fi-project-download"
          title="Download .flowink"
          onClick={() => downloadProject(project)}
        >
          ↓
        </button>
      </div>
      {showRecent && <RecentProjects onClose={() => setShowRecent(false)} />}
    </header>
  );
};
