import { useCallback, useRef, useState, type DragEvent } from "react";
import styles from "./Dropzone.module.css";

interface DropzoneProps {
  onFile: (file: File) => void;
  onText?: (text: string, fileName?: string) => void;
  error?: string | null;
  /** Render as the full-screen empty state. */
  fullscreen?: boolean;
}

/** Drag-and-drop / click-to-browse target for loading a crash file. */
export function Dropzone({ onFile, onText, error, fullscreen }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handlePaste = useCallback(async () => {
    if (!onText) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) onText(text, "pasted report");
    } catch {
      /* Clipboard access denied — silently ignore. */
    }
  }, [onText]);

  return (
    <div className={fullscreen ? styles.fullscreen : styles.inline}>
      <div
        className={`${styles.zone} ${dragging ? styles.dragging : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".ips,.crash,.txt,application/json,text/plain"
          className={styles.input}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
        <div className={styles.icon} aria-hidden>
          ⤓
        </div>
        <h1 className={styles.title}>CrashLog</h1>
        <p className={styles.subtitle}>
          Drop an Apple <code>.ips</code> crash report here, or click to browse.
        </p>
        <p className={styles.privacy}>
          Everything is parsed locally in your browser — nothing is uploaded.
        </p>
        {onText && (
          <button
            type="button"
            className={styles.pasteButton}
            onClick={(e) => {
              e.stopPropagation();
              void handlePaste();
            }}
          >
            Paste from clipboard
          </button>
        )}
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
