import { useRef } from "react";
import type { CrashReport } from "../types";
import styles from "./ReportHeader.module.css";

interface ReportHeaderProps {
  report: CrashReport;
  onOpen: (file: File) => void;
  onClose: () => void;
}

/** Top bar: app identity, the crash signal, and file actions. */
export function ReportHeader({ report, onOpen, onClose }: ReportHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { process, exception, device } = report;

  const signal = exception.signal ?? exception.type ?? "Crash";

  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        <span className={styles.badge} aria-hidden>
          {process.name.charAt(0).toUpperCase()}
        </span>
        <div className={styles.titles}>
          <div className={styles.appName} title={process.bundleId}>
            {process.name}
            {process.version && (
              <span className={styles.version}>
                {process.version}
                {process.build && process.build !== process.version
                  ? ` (${process.build})`
                  : ""}
              </span>
            )}
          </div>
          <div className={styles.meta}>
            {[device.model, device.osVersion, device.capturedAt]
              .filter(Boolean)
              .join("  ·  ")}
          </div>
        </div>
      </div>

      <div className={styles.signal} title={exception.type}>
        <span className={styles.signalDot} aria-hidden />
        {signal}
      </div>

      <div className={styles.actions}>
        <input
          ref={inputRef}
          type="file"
          accept=".ips,.crash,.txt,application/json,text/plain"
          className={styles.input}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onOpen(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className={styles.button}
          onClick={() => inputRef.current?.click()}
        >
          Open…
        </button>
        <button
          type="button"
          className={styles.buttonGhost}
          onClick={onClose}
          title="Close this report"
        >
          Close
        </button>
      </div>
    </header>
  );
}
