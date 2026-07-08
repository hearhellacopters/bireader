// fs-loader.ts  (or put it at the top of your main module)

let fsModule: typeof import("node:fs") | undefined;
let fsPromisesModule: typeof import("node:fs/promises") | undefined;

let fsPromise: Promise<typeof import("node:fs") | undefined> | undefined;
let fsPromisesPromise: Promise<typeof import("node:fs/promises") | undefined> | undefined;

const isNode = (): boolean => {
    return typeof process !== 'undefined' && 
           process.versions?.node != null;
};

// ====================== SYNC ======================
export function getFs(): typeof import("node:fs") | undefined {
    if (fsModule !== undefined) return fsModule;

    if (!isNode()) {
        fsModule = undefined;
        return undefined;
    }

    try {
        if (typeof require !== 'undefined' && require.cache) {
            // CJS - truly synchronous
            fsModule = require('node:fs');
        } else {
            // ESM - fallback
            throw new Error('ESM: use getFsAsync instead');
        }
    } catch (err) {
        console.error('Failed to load fs:', err);
        fsModule = undefined;
    }

    return fsModule;
}

// ====================== ASYNC (fs/promises) ======================
export async function getFsPromises(): Promise<typeof import("node:fs/promises") | undefined> {
    if (fsPromisesModule !== undefined) return fsPromisesModule;
    if (fsPromisesPromise) return fsPromisesPromise;

    fsPromisesPromise = (async () => {
        if (!isNode()) {
            fsPromisesModule = undefined;
            return undefined;
        }

        try {
            if (typeof require !== 'undefined' && require.cache) {
                // CJS
                const fs = require('node:fs');
                fsPromisesModule = fs.promises;
            } else {
                // ESM - dynamic import
                fsPromisesModule = await import('node:fs/promises');
            }
            return fsPromisesModule;
        } catch (err) {
            console.error('Failed to load fs/promises:', err);
            fsPromisesModule = undefined;
            return undefined;
        }
    })();

    return fsPromisesPromise;
}

export async function getFsAsync(): Promise<typeof import("node:fs") | undefined> {
    if (fsModule !== undefined) return fsModule;
    if (fsPromise) return fsPromise;

    fsPromise = (async () => {
        if (!isNode()) return undefined;
        try {
            fsModule = typeof require !== 'undefined' && require.cache
                ? require('node:fs')
                : await import('node:fs');
            return fsModule;
        } catch (err) {
            console.error('Failed to load fs:', err);
            return undefined;
        }
    })();

    return fsPromise;
}