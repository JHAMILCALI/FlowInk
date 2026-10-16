import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export const Button = ({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) => (
  <button
    {...props}
    className={`fi-button fi-button--${variant} ${className}`.trim()}
  />
);

export const IconButton = ({
  label,
  icon,
  active = false,
  className = "",
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  icon: ReactNode;
  active?: boolean;
}) => (
  <button
    {...props}
    aria-label={label}
    title={label}
    className={`fi-icon-button ${
      active ? "is-active" : ""
    } ${className}`.trim()}
  >
    {icon}
  </button>
);

export const Panel = ({
  title,
  actions,
  children,
  className = "",
}: HTMLAttributes<HTMLElement> & {
  title: string;
  actions?: ReactNode;
}) => (
  <section className={`fi-panel ${className}`.trim()}>
    <header className="fi-panel__header">
      <span>{title}</span>
      {actions}
    </header>
    <div className="fi-panel__body">{children}</div>
  </section>
);

export const EmptyState = ({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) => (
  <div className="fi-empty-state">
    <div className="fi-empty-state__icon">{icon}</div>
    <strong>{title}</strong>
    <span>{children}</span>
  </div>
);

export const Field = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <label className="fi-field">
    <span>{label}</span>
    {children}
  </label>
);
