import { useEffect, useRef } from "react";
import { APP_VERSION } from "../../version";

interface Props {
  onClose: () => void;
}

export function AboutDialog({ onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="about-backdrop"
      onClick={onBackdropClick}
      role="presentation"
    >
      <div
        className="about-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="about-dialog__logo" aria-hidden="true">
          <FolioIcon />
        </div>

        <h1 className="about-dialog__name" id="about-title">Folio</h1>
        <p className="about-dialog__version">Version {APP_VERSION}</p>
        <p className="about-dialog__tagline">
          A free, open source, read-only Markdown viewer for desktop.
        </p>

        <div className="about-dialog__links">
          <a
            href="https://github.com/yourname/folio"
            target="_blank"
            rel="noreferrer"
            className="about-dialog__link"
          >
            GitHub
          </a>
          <span className="about-dialog__link-sep" aria-hidden="true">·</span>
          <a
            href="https://github.com/yourname/folio/releases"
            target="_blank"
            rel="noreferrer"
            className="about-dialog__link"
          >
            Releases
          </a>
          <span className="about-dialog__link-sep" aria-hidden="true">·</span>
          <a
            href="https://github.com/yourname/folio/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
            className="about-dialog__link"
          >
            GPL v3 License
          </a>
        </div>

        <button className="about-dialog__close" onClick={onClose} aria-label="Close">
          Close
        </button>
      </div>
    </div>
  );
}

function FolioIcon() {
  return (
    <svg
      width="52" height="52"
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="1024" height="1024" rx="220" fill="var(--accent)" />
      <path d="M320 250V774H704V442L512 250H320Z" fill="#FFFFFF" fill-opacity="0.9"/>
      <path d="M512 250V442H704L512 250Z" fill="#FFFFFF"/>
      <path d="M512 442L704 442L512 250V442Z" fill="black" fill-opacity="0.1"/>
      <rect x="400" y="560" width="224" height="24" rx="12" fill="var(--accent)" fill-opacity="0.5"/>
      <rect x="400" y="630" width="224" height="24" rx="12" fill="var(--accent)" fill-opacity="0.5"/>
      <rect x="400" y="490" width="120" height="24" rx="12" fill="var(--accent)" fill-opacity="0.5"/>
    </svg>
  );
}
