import type { SVGProps } from "react";

const Icon = ({ children, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const SparkIcon = () => (
  <Icon>
    <path d="m12 2 1.4 5.6L19 9l-5.6 1.4L12 16l-1.4-5.6L5 9l5.6-1.4L12 2Z" />
    <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />
  </Icon>
);
export const SelectIcon = () => (
  <Icon>
    <path d="m5 3 13 8-6 2-3 6L5 3Z" />
  </Icon>
);
export const RectIcon = () => (
  <Icon>
    <rect x="4" y="5" width="16" height="14" rx="2" />
  </Icon>
);
export const DiamondIcon = () => (
  <Icon>
    <path d="m12 3 9 9-9 9-9-9 9-9Z" />
  </Icon>
);
export const EllipseIcon = () => (
  <Icon>
    <ellipse cx="12" cy="12" rx="9" ry="6.5" />
  </Icon>
);
export const ArrowIcon = () => (
  <Icon>
    <path d="M4 18 19 5M12 5h7v7" />
  </Icon>
);
export const LineIcon = () => (
  <Icon>
    <path d="M4 18 20 6" />
  </Icon>
);
export const PenIcon = () => (
  <Icon>
    <path d="M4 19c4-8 8-9 16-14M5 15c3 1 4 2 5 5" />
  </Icon>
);
export const TextIcon = () => (
  <Icon>
    <path d="M5 5h14M12 5v14M8 19h8" />
  </Icon>
);
export const ImageIcon = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8" cy="9" r="1.5" />
    <path d="m5 18 5-5 3 3 2-2 4 4" />
  </Icon>
);
export const EraserIcon = () => (
  <Icon>
    <path d="m15 4 5 5-9 10H6l-3-3L15 4Z" />
    <path d="m10 9 5 5" />
  </Icon>
);
export const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const PlayIcon = () => (
  <Icon>
    <path d="m8 5 11 7-11 7V5Z" />
  </Icon>
);
export const PauseIcon = () => (
  <Icon>
    <path d="M9 5v14M15 5v14" />
  </Icon>
);
export const PresentIcon = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="m9 21 3-4 3 4M8 21h8" />
  </Icon>
);
export const ExportIcon = () => (
  <Icon>
    <path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6" />
  </Icon>
);
export const DownloadIcon = () => (
  <Icon>
    <path d="M12 3v12M7 10l5 5 5-5M5 20h14" />
  </Icon>
);
export const FolderIcon = () => (
  <Icon>
    <path d="M3 7h7l2 2h9v10H3V7Z" />
    <path d="M3 7V5h7l2 2" />
  </Icon>
);
export const SaveIcon = () => (
  <Icon>
    <path d="M5 3h12l2 2v16H5V3Z" />
    <path d="M8 3v6h8V3M8 21v-7h8v7" />
  </Icon>
);
export const LayersIcon = () => (
  <Icon>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
  </Icon>
);
export const CameraIcon = () => (
  <Icon>
    <path d="M4 7h4l2-3h4l2 3h4v12H4V7Z" />
    <circle cx="12" cy="13" r="4" />
  </Icon>
);
export const TrashIcon = () => (
  <Icon>
    <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
  </Icon>
);
export const CopyIcon = () => (
  <Icon>
    <rect x="8" y="8" width="11" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2" />
  </Icon>
);
export const ChevronLeftIcon = () => (
  <Icon>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);
export const ChevronRightIcon = () => (
  <Icon>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);
export const UndoIcon = () => (
  <Icon>
    <path d="m9 7-5 5 5 5M5 12h8a6 6 0 0 1 6 6" />
  </Icon>
);
export const RedoIcon = () => (
  <Icon>
    <path d="m15 7 5 5-5 5M19 12h-8a6 6 0 0 0-6 6" />
  </Icon>
);
export const MoreIcon = () => (
  <Icon>
    <circle cx="5" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="19" cy="12" r="1" fill="currentColor" />
  </Icon>
);
export const SendIcon = () => (
  <Icon>
    <path d="m3 11 18-8-8 18-2-8-8-2Z" />
    <path d="m11 13 5-5" />
  </Icon>
);
export const CloseIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);
export const KodexIcon = () => (
  <Icon>
    <path d="M7 8 3 12l4 4M17 8l4 4-4 4M14 4l-4 16" />
  </Icon>
);
