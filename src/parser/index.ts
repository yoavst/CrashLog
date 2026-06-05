import type { CrashReport } from '../types'
import { looksLikeIps, parseIps } from './ips'

export class ParseError extends Error {}

/**
 * Parse the contents of an Apple `.ips` crash report into a {@link CrashReport}.
 * Throws {@link ParseError} with a human-friendly message on failure.
 */
export function parseCrashReport(text: string, fileName?: string): CrashReport {
    if (!text.trim()) {
        throw new ParseError('The file is empty.')
    }
    if (!looksLikeIps(text)) {
        throw new ParseError(
            "This doesn't look like an .ips crash report (expected two JSON " +
                'documents: a header line followed by the payload).'
        )
    }
    try {
        return parseIps(text, fileName)
    } catch (err) {
        throw new ParseError(err instanceof Error ? err.message : 'Failed to parse the report.')
    }
}
