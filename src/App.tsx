import { useMemo, useState } from "react";
import { Dropzone } from "./components/Dropzone";
import { ReportHeader } from "./components/ReportHeader";
import { Sidebar } from "./components/Sidebar";
import { BacktracePanel } from "./components/BacktracePanel";
import { SummaryPanel } from "./components/SummaryPanel";
import { BinaryImagesPanel } from "./components/BinaryImagesPanel";
import { RawPanel } from "./components/RawPanel";
import { useReportLoader } from "./hooks/useReportLoader";
import type { View } from "./components/Sidebar";
import styles from "./App.module.css";

export function App() {
  const { report, error, loadFile, loadText, reset } = useReportLoader();
  const [view, setView] = useState<View>({ kind: "overview" });
  const [query, setQuery] = useState("");

  // Default the selected thread to the one that crashed.
  const initialThread = report?.faultingThreadIndex ?? 0;

  const activeThread = useMemo(() => {
    if (!report) return null;
    const index = view.kind === "thread" ? view.threadIndex : initialThread;
    return report.threads.find((t) => t.index === index) ?? report.threads[0] ?? null;
  }, [report, view, initialThread]);

  if (!report) {
    return (
      <Dropzone onFile={loadFile} onText={loadText} error={error} fullscreen />
    );
  }

  return (
    <div className={styles.app}>
      <ReportHeader
        report={report}
        onOpen={loadFile}
        onClose={reset}
      />
      <div className={styles.body}>
        <Sidebar
          report={report}
          view={view}
          onSelect={setView}
          query={query}
          onQueryChange={setQuery}
          defaultThreadIndex={initialThread}
        />
        <main className={styles.main}>
          {view.kind === "overview" && (
            <SummaryPanel report={report} onSelectThread={setView} />
          )}
          {view.kind === "images" && (
            <BinaryImagesPanel images={report.images} query={query} />
          )}
          {view.kind === "raw" && <RawPanel report={report} />}
          {view.kind === "thread" && activeThread && (
            <BacktracePanel
              thread={activeThread}
              images={report.images}
              query={query}
            />
          )}
        </main>
      </div>
    </div>
  );
}
