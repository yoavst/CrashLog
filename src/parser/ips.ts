/**
 * Parser for Apple's modern `.ips` crash format (iOS 14+ / macOS 11+).
 *
 * An `.ips` file is two JSON documents separated by a newline:
 *   1. A small "header" object (incident id, app name, os version, …).
 *   2. The full "payload" object (threads, images, exception, …).
 */

import type {
    BinaryImage,
    CrashReport,
    ExceptionInfo,
    KeyValue,
    StackFrame,
    TerminationInfo,
    Thread,
} from '../types'
import { basename, toHexAddress } from './format'

/** Returns true if `text` looks like a two-part `.ips` document. */
export function looksLikeIps(text: string): boolean {
    const trimmed = text.trimStart()
    if (!trimmed.startsWith('{')) return false
    const { header, payload } = splitDocuments(text)
    return header !== null && payload !== null
}

interface IpsHeader {
    app_name?: string
    app_version?: string
    build_version?: string
    bundleID?: string
    os_version?: string
    timestamp?: string
    name?: string
}

interface IpsImage {
    source?: string
    arch?: string
    base?: number
    size?: number
    uuid?: string
    path?: string
    name?: string
}

interface IpsFrame {
    imageIndex?: number
    imageOffset?: number
    symbol?: string
    symbolLocation?: number
    sourceFile?: string
    sourceLine?: number
}

interface IpsThread {
    id?: number
    name?: string
    queue?: string
    triggered?: boolean
    frames?: IpsFrame[]
    threadState?: {
        x?: { value: number }[]
        lr?: { value: number }
        sp?: { value: number }
        fp?: { value: number }
        pc?: { value: number }
        cpsr?: { value: number }
        flavor?: string
    }
}

interface IpsPayload {
    procName?: string
    procPath?: string
    pid?: number
    parentProc?: string
    parentPid?: number
    coalitionName?: string
    captureTime?: string
    uptime?: number
    osVersion?: { train?: string; build?: string; releaseType?: string }
    modelCode?: string
    cpuType?: string
    platform?: number
    exception?: { type?: string; signal?: string; subtype?: string; codes?: string }
    asi?: Record<string, string[]>
    termination?: {
        namespace?: string
        code?: number
        indicator?: string
        reasons?: string[]
        details?: string[]
    }
    threads?: IpsThread[]
    usedImages?: IpsImage[]
    faultingThread?: number
    vmRegionInfo?: string
}

/** Split the raw file into its header and payload JSON objects. */
function splitDocuments(text: string): {
    header: IpsHeader | null
    payload: IpsPayload | null
} {
    const newline = text.indexOf('\n')
    if (newline === -1) return { header: null, payload: null }

    const headerText = text.slice(0, newline).trim()
    const payloadText = text.slice(newline + 1).trim()

    let header: IpsHeader | null = null
    let payload: IpsPayload | null = null
    try {
        header = JSON.parse(headerText) as IpsHeader
    } catch {
        header = null
    }
    try {
        payload = JSON.parse(payloadText) as IpsPayload
    } catch {
        payload = null
    }
    return { header, payload }
}

function buildImages(used: IpsImage[]): BinaryImage[] {
    return used.map((img, index) => {
        const baseValue = img.base ?? 0
        return {
            index,
            name: img.name ?? basename(img.path) ?? `image ${index}`,
            uuid: normalizeUuid(img.uuid),
            arch: img.arch,
            base: toHexAddress(baseValue),
            baseValue,
            size: img.size,
            path: img.path,
        }
    })
}

function normalizeUuid(uuid: string | undefined): string | undefined {
    if (!uuid) return undefined
    return uuid.toUpperCase()
}

function buildFrames(frames: IpsFrame[], images: BinaryImage[]): StackFrame[] {
    return frames.map((frame, depth) => {
        const imageIndex = frame.imageIndex ?? -1
        const image = images[imageIndex]
        const baseValue = image?.baseValue ?? 0
        const offset = frame.imageOffset ?? 0
        return {
            depth,
            image: image?.name ?? '???',
            imageIndex,
            address: toHexAddress(baseValue + offset),
            imageOffset: offset,
            symbol: frame.symbol,
            symbolOffset: frame.symbolLocation,
            sourceFile: frame.sourceFile ? basename(frame.sourceFile) : undefined,
            sourceLine: frame.sourceLine,
        }
    })
}

function buildThreads(payload: IpsPayload, images: BinaryImage[]): Thread[] {
    const ipsThreads = payload.threads ?? []
    return ipsThreads.map((thread, index) => {
        const crashed = thread.triggered === true || payload.faultingThread === index
        return {
            index,
            name: thread.name,
            queue: thread.queue,
            crashed,
            frames: buildFrames(thread.frames ?? [], images),
            registers: buildRegisters(thread.threadState),
        }
    })
}

function buildRegisters(state: IpsThread['threadState']): KeyValue[] | undefined {
    if (!state?.x?.length) return undefined
    const registers: KeyValue[] = state.x.map((reg, i) => ({
        key: `x${i}`,
        value: toHexAddress(reg.value ?? 0, 16),
    }))
    for (const key of ['lr', 'sp'] as const) {
        const reg = state[key]
        if (reg) registers.push({ key, value: toHexAddress(reg.value ?? 0, 16) })
    }
    return registers
}

function buildException(payload: IpsPayload): ExceptionInfo {
    const exc = payload.exception ?? {}
    const signatures: string[] = []
    if (payload.asi) {
        for (const [lib, lines] of Object.entries(payload.asi)) {
            for (const line of lines) signatures.push(`${lib}: ${line}`)
        }
    }
    return {
        type: exc.type,
        signal: exc.signal,
        subtype: exc.subtype,
        codes: exc.codes,
        signatures,
    }
}

function buildTermination(payload: IpsPayload): TerminationInfo | undefined {
    const term = payload.termination
    if (!term) return undefined
    return {
        namespace: term.namespace,
        code: term.code,
        indicator: term.indicator,
        reasons: [...(term.reasons ?? []), ...(term.details ?? [])],
    }
}

function buildExtra(payload: IpsPayload): KeyValue[] {
    const extra: KeyValue[] = []
    if (payload.vmRegionInfo) extra.push({ key: 'VM Region Info', value: payload.vmRegionInfo })
    return extra
}

export function parseIps(text: string, fileName?: string): CrashReport {
    const { header, payload } = splitDocuments(text)
    if (!payload) {
        throw new Error('Could not parse the .ips payload as JSON.')
    }

    const images = buildImages(payload.usedImages ?? [])
    const threads = buildThreads(payload, images)
    const faultingThreadIndex = threads.findIndex((t) => t.crashed)

    return {
        fileName,
        process: {
            name: payload.procName ?? header?.app_name ?? 'Unknown',
            bundleId: header?.bundleID,
            version: header?.app_version,
            build: header?.build_version,
            path: payload.procPath,
            pid: payload.pid,
            parentName: payload.parentProc,
            parentPid: payload.parentPid,
        },
        device: {
            model: payload.modelCode,
            osVersion: payload.osVersion?.train ?? header?.os_version,
            osBuild: payload.osVersion?.build,
            cpuType: payload.cpuType,
            capturedAt: payload.captureTime ?? header?.timestamp,
            uptimeSeconds: payload.uptime,
        },
        exception: buildException(payload),
        termination: buildTermination(payload),
        threads,
        faultingThreadIndex: faultingThreadIndex >= 0 ? faultingThreadIndex : undefined,
        images,
        extra: buildExtra(payload),
        raw: text,
    }
}
