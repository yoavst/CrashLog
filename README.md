# CrashLog

An **offline** web GUI for inspecting Apple iOS/macOS crash reports — like
Console.app's crash viewer, but it runs entirely in your browser and nothing is
ever uploaded.

Drop in an Apple `.ips` crash report and get a readable, navigable view of the
exception, every thread's backtrace, the loaded binary images, and the raw
payload.

## Features

- **`.ips` parser** — handles the modern (iOS 14+ / macOS 11+) two-document
  JSON crash format: header line + payload.
- **Overview** — the termination signal, exception type/codes, OS termination
  reason, Apple's additional signatures (`asi`), process/device metadata, and a
  peek at the crashed thread.
- **Per-thread backtraces** — addresses are resolved against each binary's load
  address; symbols, source file/line, and the thread register state are shown
  when present. Your own app frames are highlighted in hazard amber.
- **Binary images** — load addresses, sizes, architectures, UUIDs and paths
  (UUIDs are what you match against your `.dSYM` for symbolication).
- **Live filtering** — filter frames, symbols, and images as you type.
- **Raw view** — pretty-printed JSON with copy-to-clipboard.

Everything is client-side: open a report on a plane, no network required.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5180
```

Then drag `samples/SampleApp-2026-06-05.ips` onto the window to see it in action.

### Production build

```bash
npm run build      # outputs static files to dist/
npm run preview    # serve the build locally
```

The build uses a relative base path, so `dist/` can be served from any
location (or hosted on any static host).

## Project layout

```
src/
  types.ts                 Normalized CrashReport domain model
  parser/
    ips.ts                 Apple .ips (JSON) format parser
    format.ts              Hex/address/byte formatting helpers
    index.ts               parseCrashReport() entry point + error handling
  hooks/
    useReportLoader.ts     File reading + parsing state (all local)
  components/
    Dropzone.tsx           Drag-and-drop / browse / paste loader
    ReportHeader.tsx       Top bar: app identity + crash signal
    Sidebar.tsx            Navigation + thread list
    SummaryPanel.tsx       Overview view
    BacktracePanel.tsx     Per-thread backtrace + registers
    BinaryImagesPanel.tsx  Loaded images table
    RawPanel.tsx           Raw / pretty-printed payload
  styles/index.css         Design tokens + global styles
```

## Notes on symbolication

CrashLog displays whatever symbols are already in the report. Fully
unsymbolicated reports will show `image + offset` per frame; use the UUIDs in
the **Binary Images** view together with `atos`/`symbolicatecrash` and matching
`.dSYM` files to symbolicate offline.

## Tech

React 18 · TypeScript (strict) · Vite · CSS Modules. No runtime dependencies
beyond React.
