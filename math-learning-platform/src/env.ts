/**
 * True in the self-contained "artifact" build (npm run build:artifact), which
 * runs inside a sandboxed frame: no print dialog, no hash deep links.
 */
export const IS_EMBEDDED = import.meta.env.MODE === 'artifact';
