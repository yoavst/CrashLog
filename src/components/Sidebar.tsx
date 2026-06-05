import type { CrashReport, StackFrame, Thread } from "../types";
import styles from "./Sidebar.module.css";

export type View =
  | { kind: "overview" }
  | { kind: "thread"; threadIndex: number }
  | { kind: "images" }
  | { kind: "raw" };

interface SidebarProps {
  report: CrashReport;
  view: View;
  onSelect: (view: View) => void;
  query: string;
  onQueryChange: (value: string) => void;
  defaultThreadIndex: number;
}

export function Sidebar({
  report,
  view,
  onSelect,
  query,
  onQueryChange,
}: SidebarProps) {
  const isActive = (v: View) => sameView(v, view);

  // Filter the thread list to threads containing a frame that matches the
  // query (case-insensitive substring). Frames themselves are never filtered.
  const visibleThreads = report.threads.filter((thread) =>
    threadMatchesQuery(thread, query),
  );

  return (
    <nav className={styles.sidebar}>
      <div className={styles.search}>
        <input
          type="search"
          placeholder="Filter threads by frame…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <ul className={styles.nav}>
        <NavItem
          label="Overview"
          active={isActive({ kind: "overview" })}
          onClick={() => onSelect({ kind: "overview" })}
        />
        <NavItem
          label="Binary Images"
          count={report.images.length}
          active={isActive({ kind: "images" })}
          onClick={() => onSelect({ kind: "images" })}
        />
        <NavItem
          label="Raw Report"
          active={isActive({ kind: "raw" })}
          onClick={() => onSelect({ kind: "raw" })}
        />
      </ul>

      <div className={styles.sectionLabel}>
        Threads{" "}
        <span className={styles.sectionCount}>
          {query.trim()
            ? `${visibleThreads.length}/${report.threads.length}`
            : report.threads.length}
        </span>
      </div>
      <ul className={styles.threadList}>
        {visibleThreads.length === 0 ? (
          <li className={styles.threadEmpty}>No threads match “{query}”.</li>
        ) : (
          visibleThreads.map((thread) => (
            <ThreadItem
              key={thread.index}
              thread={thread}
              active={
                view.kind === "thread" && view.threadIndex === thread.index
              }
              onClick={() =>
                onSelect({ kind: "thread", threadIndex: thread.index })
              }
            />
          ))
        )}
      </ul>
    </nav>
  );
}

function sameView(a: View, b: View): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "thread" && b.kind === "thread")
    return a.threadIndex === b.threadIndex;
  return true;
}

interface NavItemProps {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

function NavItem({ label, count, active, onClick }: NavItemProps) {
  return (
    <li>
      <button
        type="button"
        className={`${styles.navItem} ${active ? styles.active : ""}`}
        onClick={onClick}
      >
        <span>{label}</span>
        {count !== undefined && <span className={styles.badge}>{count}</span>}
      </button>
    </li>
  );
}

interface ThreadItemProps {
  thread: Thread;
  active: boolean;
  onClick: () => void;
}

function ThreadItem({ thread, active, onClick }: ThreadItemProps) {
  const label = threadLabel(thread);
  return (
    <li>
      <button
        type="button"
        className={`${styles.threadItem} ${active ? styles.active : ""} ${
          thread.crashed ? styles.crashed : ""
        }`}
        onClick={onClick}
      >
        <span className={styles.threadNumber}>{thread.index}</span>
        <span className={styles.threadLabel} title={label}>
          {label}
        </span>
        {thread.crashed && <span className={styles.crashTag}>CRASHED</span>}
        <span className={styles.frameCount}>{thread.frames.length}</span>
      </button>
    </li>
  );
}

function threadLabel(thread: Thread): string {
  if (thread.name) return thread.name;
  if (thread.queue) return thread.queue;
  return `Thread ${thread.index}`;
}

/** A thread matches when any of its frames contains the query as a substring. */
function threadMatchesQuery(thread: Thread, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return thread.frames.some((frame) => frameMatchesQuery(frame, q));
}

function frameMatchesQuery(frame: StackFrame, q: string): boolean {
  return Boolean(
    frame.symbol?.toLowerCase().includes(q) ||
      frame.image.toLowerCase().includes(q) ||
      frame.address.toLowerCase().includes(q) ||
      frame.sourceFile?.toLowerCase().includes(q),
  );
}
