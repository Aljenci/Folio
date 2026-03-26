export type ErrorType =
  | "file_not_found"
  | "permission_denied"
  | "encoding_error"
  | "general";

interface Props {
  type: ErrorType;
  path?: string;
  /** Raw error string shown in small print so users can report exact errors. */
  detail?: string;
  onDismiss: () => void;
}

const ERROR_COPY: Record<ErrorType, { title: string; body: string }> = {
  file_not_found: {
    title: "File not found",
    body: "This file may have been moved or deleted.",
  },
  permission_denied: {
    title: "Cannot read this file",
    body: "Folio does not have permission to open this file.",
  },
  encoding_error: {
    title: "Cannot read this file",
    body: "This file does not appear to be a text document.",
  },
  general: {
    title: "Something went wrong",
    body: "Folio encountered an unexpected error.",
  },
};

/**
 * Dismissible error banner displayed as a fixed toast above the document.
 *
 * Uses role="alert" so screen readers announce it immediately, interrupting
 * whatever they were currently reading. The icon is aria-hidden since the
 * text already conveys the error state.
 */
export function ErrorBanner({ type, path, detail, onDismiss }: Props) {
  const copy = ERROR_COPY[type];

  return (
    <div className="error-banner" role="alert">
      <div className="error-banner__content">
        <span className="error-banner__icon" aria-hidden="true">
          ⚠
        </span>
        <div className="error-banner__text">
          <p className="error-banner__title">{copy.title}</p>
          <p className="error-banner__body">{copy.body}</p>
          {path && <p className="error-banner__path">{path}</p>}
          {detail && <p className="error-banner__detail">{detail}</p>}
        </div>
      </div>
      <button
        className="error-banner__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss error message"
      >
        ✕
      </button>
    </div>
  );
}

/** Classify a raw error string into an ErrorType. */
export function classifyError(raw: string): ErrorType {
  const lower = raw.toLowerCase();
  if (lower.includes("not found") || lower.includes("enoent") || lower.includes("no such file")) {
    return "file_not_found";
  }
  if (lower.includes("permission") || lower.includes("access denied") || lower.includes("eperm")) {
    return "permission_denied";
  }
  if (lower.includes("encoding") || lower.includes("utf") || lower.includes("invalid byte")) {
    return "encoding_error";
  }
  return "general";
}
