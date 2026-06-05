import { useMemo, useState } from "react";
import type { CrashReport } from "../types";
import styles from "./RawPanel.module.css";

interface RawPanelProps {
  report: CrashReport;
}

/** Shows the original report text, pretty-printing the JSON payload. */
export function RawPanel({ report }: RawPanelProps) {
  const [copied, setCopied] = useState(false);

  const pretty = useMemo(() => prettyPrint(report.raw), [report.raw]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report.raw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.bar}>
        <h2 className={styles.title}>Raw Report</h2>
        <button type="button" className={styles.copy} onClick={() => void copy()}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className={styles.pre}>{pretty}</pre>
    </div>
  );
}

/** Pretty-print the `.ips` payload (header line + JSON body) when possible. */
function prettyPrint(raw: string): string {
  const newline = raw.indexOf("\n");
  if (newline === -1) return raw;
  const header = raw.slice(0, newline).trim();
  const body = raw.slice(newline + 1).trim();
  try {
    const headerObj = JSON.parse(header);
    const bodyObj = JSON.parse(body);
    return (
      JSON.stringify(headerObj, null, 2) +
      "\n\n" +
      JSON.stringify(bodyObj, null, 2)
    );
  } catch {
    return raw;
  }
}
