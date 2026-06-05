import { useCallback, useState } from "react";
import { ParseError, parseCrashReport } from "../parser";
import type { CrashReport } from "../types";

interface LoaderState {
  report: CrashReport | null;
  error: string | null;
  loading: boolean;
}

/**
 * Manages reading a crash file from disk (or pasted text) and parsing it.
 * All work happens locally in the browser — nothing is uploaded.
 */
export function useReportLoader() {
  const [state, setState] = useState<LoaderState>({
    report: null,
    error: null,
    loading: false,
  });

  const loadText = useCallback((text: string, fileName?: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const report = parseCrashReport(text, fileName);
      setState({ report, error: null, loading: false });
    } catch (err) {
      const message =
        err instanceof ParseError
          ? err.message
          : "An unexpected error occurred while parsing the file.";
      setState({ report: null, error: message, loading: false });
    }
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      loadText(text, file.name);
    },
    [loadText],
  );

  const reset = useCallback(() => {
    setState({ report: null, error: null, loading: false });
  }, []);

  return { ...state, loadFile, loadText, reset };
}
