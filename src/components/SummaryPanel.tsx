import type { ReactNode } from "react";
import type { CrashReport } from "../types";
import type { View } from "./Sidebar";
import styles from "./SummaryPanel.module.css";

interface SummaryPanelProps {
  report: CrashReport;
  onSelectThread: (view: View) => void;
}

/** The landing "Overview" view: the crash story at a glance. */
export function SummaryPanel({ report, onSelectThread }: SummaryPanelProps) {
  const { exception, termination, process, device, threads } = report;
  const crashed = threads.find((t) => t.crashed);

  return (
    <div className={styles.panel}>
      <section className={styles.fault}>
        <div className={styles.faultLabel}>Termination Signal</div>
        <div className={styles.faultSignal}>
          {exception.signal ?? exception.type ?? "Unknown"}
        </div>
        {exception.type && exception.signal && (
          <div className={styles.faultType}>{exception.type}</div>
        )}
        <dl className={styles.faultDetails}>
          {exception.subtype && (
            <Detail label="Subtype" value={exception.subtype} />
          )}
          {exception.codes && (
            <Detail label="Codes" value={exception.codes} mono />
          )}
        </dl>
        {exception.signatures.length > 0 && (
          <ul className={styles.signatures}>
            {exception.signatures.map((sig, i) => (
              <li key={i}>{sig}</li>
            ))}
          </ul>
        )}
      </section>

      <div className={styles.grid}>
        <Card title="Process">
          <Detail label="Name" value={process.name} />
          <Detail label="Bundle ID" value={process.bundleId} mono />
          <Detail
            label="Version"
            value={
              process.version
                ? `${process.version}${process.build ? ` (${process.build})` : ""}`
                : undefined
            }
          />
          <Detail label="PID" value={process.pid?.toString()} mono />
          <Detail
            label="Parent"
            value={
              process.parentName
                ? `${process.parentName}${process.parentPid ? ` [${process.parentPid}]` : ""}`
                : undefined
            }
          />
          <Detail label="Path" value={process.path} mono wrap />
        </Card>

        <Card title="Device">
          <Detail label="Model" value={device.model} mono />
          <Detail label="OS" value={device.osVersion} />
          <Detail label="Build" value={device.osBuild} mono />
          <Detail label="CPU" value={device.cpuType} />
          <Detail label="Captured" value={device.capturedAt} />
          <Detail
            label="Uptime"
            value={
              device.uptimeSeconds !== undefined
                ? `${device.uptimeSeconds.toLocaleString()} s`
                : undefined
            }
          />
        </Card>

        {termination && (
          <Card title="Termination">
            <Detail label="Namespace" value={termination.namespace} mono />
            <Detail label="Code" value={termination.code?.toString()} mono />
            <Detail label="Indicator" value={termination.indicator} />
            {termination.reasons.map((reason, i) => (
              <Detail key={i} label={i === 0 ? "Reason" : ""} value={reason} wrap />
            ))}
          </Card>
        )}

        {report.extra.length > 0 && (
          <Card wide>
            {report.extra.map((kv) => (
              <Detail key={kv.key} label={kv.key} value={kv.value} stacked wrap />
            ))}
          </Card>
        )}
      </div>

      {crashed && (
        <section className={styles.peek}>
          <div className={styles.peekHead}>
            <span className={styles.peekTitle}>
              Crashed Thread {crashed.index}
              {crashed.name ? ` · ${crashed.name}` : ""}
            </span>
            <button
              type="button"
              className={styles.peekLink}
              onClick={() =>
                onSelectThread({ kind: "thread", threadIndex: crashed.index })
              }
            >
              View full backtrace →
            </button>
          </div>
          <ol className={styles.peekFrames}>
            {crashed.frames.slice(0, 8).map((frame) => (
              <li key={frame.depth} className={styles.peekFrame}>
                <span className={styles.peekDepth}>{frame.depth}</span>
                <span className={styles.peekImage}>{frame.image}</span>
                <span className={styles.peekSymbol}>
                  {frame.symbol ?? frame.address}
                  {frame.symbolOffset !== undefined && (
                    <span className={styles.peekOffset}> + {frame.symbolOffset}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function Card({
  title,
  wide,
  children,
}: {
  title?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`${styles.card} ${wide ? styles.cardWide : ""}`}>
      {title && <h3 className={styles.cardTitle}>{title}</h3>}
      <dl className={styles.dl}>{children}</dl>
    </section>
  );
}

function Detail({
  label,
  value,
  mono,
  wrap,
  stacked,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  wrap?: boolean;
  /** Place the label above the value instead of beside it. */
  stacked?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={`${styles.detail} ${stacked ? styles.detailStacked : ""}`}>
      <dt className={styles.dt}>{label}</dt>
      <dd className={`${styles.dd} ${mono ? styles.mono : ""} ${wrap ? styles.wrap : ""}`}>
        {value}
      </dd>
    </div>
  );
}
