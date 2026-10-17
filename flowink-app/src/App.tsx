import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { SparkIcon } from "./components/Icons";
import { useAutosave } from "./hooks/useAutosave";
import { loadLastProject } from "./services/persistence";
import { useFlowInkStore } from "./stores/useFlowInkStore";

const EditorShell = lazy(() =>
  import("./components/EditorShell").then((module) => ({
    default: module.EditorShell,
  })),
);
const Presenter = lazy(() =>
  import("./components/Presenter").then((module) => ({
    default: module.Presenter,
  })),
);

const normalizePath = (path: string) =>
  path === "/" ? "/editor" : path.replace(/\/$/, "");

export const App = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState(() =>
    normalizePath(globalThis.location?.pathname ?? "/editor"),
  );
  const hydrated = useFlowInkStore((state) => state.hydrated);
  const setHydrated = useFlowInkStore((state) => state.setHydrated);
  const setProject = useFlowInkStore((state) => state.setProject);
  const editorTheme = useFlowInkStore((state) => state.editorTheme);
  useAutosave();

  useEffect(() => {
    const ownerWindow = rootRef.current?.ownerDocument.defaultView;
    try {
      ownerWindow?.localStorage.setItem("flowink-editor-theme", editorTheme);
    } catch {
      // The current theme remains active for this session.
    }
  }, [editorTheme]);

  useEffect(() => {
    void loadLastProject()
      .then((project) => {
        if (project) setProject(project);
      })
      .finally(() => setHydrated(true));
  }, [setHydrated, setProject]);

  useEffect(() => {
    const ownerWindow = rootRef.current?.ownerDocument.defaultView;
    if (!ownerWindow) return;
    const onPopState = () =>
      setPath(normalizePath(ownerWindow.location.pathname));
    ownerWindow.addEventListener("popstate", onPopState);
    return () => ownerWindow.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((nextPath: string) => {
    const ownerWindow = rootRef.current?.ownerDocument.defaultView;
    ownerWindow?.history.pushState({}, "", nextPath);
    setPath(normalizePath(nextPath));
  }, []);

  const loading = (
    <div className="fi-splash">
      <span>
        <SparkIcon />
      </span>
      <strong>FLOWINK</strong>
      <small>Loading your local workspace…</small>
    </div>
  );

  if (!hydrated) {
    return <div ref={rootRef}>{loading}</div>;
  }

  return (
    <div ref={rootRef} className="fi-route-root">
      <Suspense fallback={loading}>
        {path === "/present" ? (
          <Presenter navigate={navigate} />
        ) : path === "/obs" ? (
          <Presenter navigate={navigate} obs />
        ) : path === "/player" ? (
          <Presenter navigate={navigate} player />
        ) : (
          <EditorShell navigate={navigate} />
        )}
      </Suspense>
    </div>
  );
};
