/**
 * Normalized, format-agnostic crash report model.
 *
 * Both the modern Apple `.ips` JSON format and the legacy `.crash` text format
 * are parsed into this shape so the UI never has to care which it came from.
 */

export interface CrashReport {
  /** Original file name, if available. */
  fileName?: string;

  /** Process / app metadata. */
  process: ProcessInfo;
  /** Device / OS metadata. */
  device: DeviceInfo;

  /** The exception / signal that brought the process down. */
  exception: ExceptionInfo;
  /** OS termination reason, when present. */
  termination?: TerminationInfo;

  /** All threads captured at crash time. */
  threads: Thread[];
  /** Index into `threads` of the thread that triggered the crash, if known. */
  faultingThreadIndex?: number;

  /** Loaded binary images, indexed as referenced by frames. */
  images: BinaryImage[];

  /** Additional diagnostic key/value pairs that don't fit elsewhere. */
  extra: KeyValue[];

  /** The raw text/JSON the report was parsed from (for the "Raw" tab). */
  raw: string;
}

export interface ProcessInfo {
  name: string;
  bundleId?: string;
  version?: string;
  build?: string;
  path?: string;
  pid?: number;
  parentName?: string;
  parentPid?: number;
}

export interface DeviceInfo {
  model?: string;
  osVersion?: string;
  osBuild?: string;
  platform?: string;
  cpuType?: string;
  /** ISO-ish capture timestamp string as reported. */
  capturedAt?: string;
  /** Seconds of uptime before the crash, if reported. */
  uptimeSeconds?: number;
}

export interface ExceptionInfo {
  type?: string;
  signal?: string;
  subtype?: string;
  /** Raw exception code string, e.g. "0x0000000000000001, 0x...". */
  codes?: string;
  /** Free-form additional signature lines (Apple's `asi`). */
  signatures: string[];
}

export interface TerminationInfo {
  namespace?: string;
  code?: number;
  indicator?: string;
  reasons: string[];
}

export interface Thread {
  /** Index of the thread within the report (0-based). */
  index: number;
  name?: string;
  /** Dispatch queue label, when present. */
  queue?: string;
  /** True for the thread that triggered the crash. */
  crashed: boolean;
  frames: StackFrame[];
  /** Register dump, if captured (legacy format / threadState). */
  registers?: KeyValue[];
}

export interface StackFrame {
  /** Position in the backtrace (0 = innermost). */
  depth: number;
  /** Name of the binary image this frame belongs to. */
  image: string;
  /** Index into `CrashReport.images`, or -1 if unresolved. */
  imageIndex: number;
  /** Absolute instruction address. */
  address: string;
  /** Symbol name, when symbolicated. */
  symbol?: string;
  /** Byte offset from `symbol`. */
  symbolOffset?: number;
  /** Source file basename, when available. */
  sourceFile?: string;
  /** Source line, when available. */
  sourceLine?: number;
}

export interface BinaryImage {
  index: number;
  name: string;
  uuid?: string;
  arch?: string;
  /** Load address as a hex string. */
  base: string;
  /** Numeric load address, for range checks. */
  baseValue: number;
  /** Image size in bytes. */
  size?: number;
  path?: string;
}

export interface KeyValue {
  key: string;
  value: string;
}
