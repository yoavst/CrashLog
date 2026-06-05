import { useMemo } from "react";
import type { BinaryImage, StackFrame, Thread } from "../types";
import styles from "./BacktracePanel.module.css";

interface BacktracePanelProps {
  thread: Thread;
  images: BinaryImage[];
  query: string;
}

/** Renders one thread's backtrace, register dump, and frame details. */
export function BacktracePanel({ thread, query, images }: BacktracePanelProps) {
  const frames = useMemo(
    () => filterFrames(thread.frames, query),
    [thread.frames, query],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <h2 className={styles.title}>
          Thread {thread.index}
          {thread.crashed && <span className={styles.crashed}>Crashed</span>}
        </h2>
        {(thread.name || thread.queue) && (
          <div className={styles.subhead}>
            {thread.name && <span>{thread.name}</span>}
            {thread.queue && (
              <span className={styles.queue}>queue: {thread.queue}</span>
            )}
          </div>
        )}
      </div>

      {frames.length === 0 ? (
        <p className={styles.empty}>No frames match “{query}”.</p>
      ) : (
        <ol className={styles.frames}>
          {frames.map((frame) => (
            <FrameRow
              key={frame.depth}
              frame={frame}
              highlighted={isAppFrame(frame, images)}
            />
          ))}
        </ol>
      )}

      {thread.registers && thread.registers.length > 0 && (
        <RegisterDump registers={thread.registers} />
      )}
    </div>
  );
}

function FrameRow({
  frame,
  highlighted,
}: {
  frame: StackFrame;
  highlighted: boolean;
}) {
  return (
    <li className={`${styles.frame} ${highlighted ? styles.appFrame : ""}`}>
      <span className={styles.depth}>{frame.depth}</span>
      <span className={styles.image} title={frame.image}>
        {frame.image}
      </span>
      <span className={styles.address}>{frame.address}</span>
      <span className={styles.symbol}>
        {frame.symbol ? (
          <>
            <span className={styles.symbolName}>{frame.symbol}</span>
            {frame.symbolOffset !== undefined && (
              <span className={styles.offset}> + {frame.symbolOffset}</span>
            )}
          </>
        ) : (
          <span className={styles.unsymbolicated}>
            {frame.image} + offset
          </span>
        )}
        {frame.sourceFile && (
          <span className={styles.source}>
            {frame.sourceFile}
            {frame.sourceLine !== undefined ? `:${frame.sourceLine}` : ""}
          </span>
        )}
      </span>
    </li>
  );
}

function RegisterDump({ registers }: { registers: { key: string; value: string }[] }) {
  return (
    <section className={styles.registers}>
      <h3 className={styles.registersTitle}>Thread State</h3>
      <div className={styles.registerGrid}>
        {registers.map((reg) => (
          <div key={reg.key} className={styles.register}>
            <span className={styles.regName}>{reg.key}</span>
            <span className={styles.regValue}>{reg.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Frames in non-system images are most often the developer's own code, so we
 * highlight them. System libraries live under /System, /usr, or the dyld
 * shared cache; everything else is treated as app code.
 */
function isAppFrame(frame: StackFrame, images: BinaryImage[]): boolean {
  const path = images[frame.imageIndex]?.path;
  if (!path) return false;
  const isSystem =
    path.startsWith("/System/") ||
    path.startsWith("/usr/") ||
    path.startsWith("/Library/") ||
    path.includes("/dyld_shared_cache");
  return !isSystem;
}

function filterFrames(frames: StackFrame[], query: string): StackFrame[] {
  const q = query.trim().toLowerCase();
  if (!q) return frames;
  return frames.filter((frame) => {
    return (
      frame.symbol?.toLowerCase().includes(q) ||
      frame.image.toLowerCase().includes(q) ||
      frame.address.toLowerCase().includes(q) ||
      frame.sourceFile?.toLowerCase().includes(q)
    );
  });
}
