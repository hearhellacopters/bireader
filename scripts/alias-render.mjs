/**
 * Renders the mechanical alias members for the facades from the single declarative
 * source of truth in scripts/alias-spec.mjs. Consumed by scripts/apply-aliases.mjs.
 *
 *   node scripts/apply-aliases.mjs    # rewrite the generated block in the four facades
 *
 * Numbered-bit and endian/sign variants are DERIVED here - never typed by hand - which is
 * what makes the class of copy-paste endian/sign bug (the old wpstring1le/be swap) impossible.
 * test/aliases.parity.test.ts enforces that the live classes match this spec.
 */
import { expandNumeric, expandBits } from './alias-spec.mjs';

// --- argument renderers --------------------------------------------------------

/** Reader delegate args for an int/float numeric spec (no value prefix). */
function readArgs(s) {
    if (s.kind === 'float') {
        return s.endian === 'little' ? '"little"' : s.endian === 'big' ? '"big"' : '';
    }
    if (s.endian === 'default') {
        return s.signed ? 'true' : '';
    }
    const e = s.endian === 'little' ? '"little"' : '"big"';
    return `${s.signed ? 'true' : 'false'}, ${e}`;
}

/** Writer delegate args (value-prefixed). */
function writeArgs(s) {
    const rest = readArgs(s);
    return rest ? `value, ${rest}` : 'value';
}

function readBitArgs(s) {
    const parts = [String(s.width)];
    if (s.endian !== 'default') {
        parts.push(s.signed ? 'true' : 'undefined');
        parts.push(s.endian === 'little' ? '"little"' : '"big"');
    } else if (s.signed) {
        parts.push('true');
    }
    return parts.join(', ');
}

function writeBitArgs(s) {
    const parts = ['value', String(s.width)];
    if (s.endian !== 'default') {
        parts.push(s.signed ? 'true' : 'undefined');
        parts.push(s.endian === 'little' ? '"little"' : '"big"');
    } else if (s.signed) {
        parts.push('true');
    }
    return parts.join(', ');
}

const retType = (s) => (s.kind === 'int' && s.width === 64) ? 'alwaysBigInt extends true ? bigint : BigValue' : 'number';
const valType = (s) => (s.kind === 'int' && s.width === 64) ? 'BigValue' : 'number';

/** Concise single-line JSDoc so IntelliSense still describes each alias. */
function jsdoc(s, write) {
    const verb = write ? 'Write' : 'Read';
    const e = s.endian === 'default' ? '' : ` (${s.endian}-endian)`;
    if (s.kind === 'bit') {
        const sign = s.signed ? 'unsigned' : 'signed';
        return `/** ${verb} ${s.width} ${sign} bit${s.width === 1 ? '' : 's'}${e}. */`;
    }
    if (s.kind === 'float') {
        return `/** ${verb} ${s.width === 8 ? 'an' : 'a'} ${s.width}-bit float${e}. */`;
    }
    const sign = s.signed ? 'unsigned' : 'signed';
    const art = s.signed ? 'an' : 'a'; // "an unsigned" / "a signed"
    return `/** ${verb} ${art} ${sign} ${s.width}-bit integer${e}. */`;
}

// --- member renderers ----------------------------------------------------------

function syncReader(s) {
    const args = s.kind === 'bit' ? readBitArgs(s) : readArgs(s);
    const del = s.kind === 'bit' ? 'bit' : s.read;
    return `    ${jsdoc(s, false)}\n    get ${s.name}(): ${retType(s)} { return this.${del}(${args}); }\n`;
}

function syncWriter(s) {
    const args = s.kind === 'bit' ? writeBitArgs(s) : writeArgs(s);
    const del = s.kind === 'bit' ? 'bit' : s.write;
    return `    ${jsdoc(s, true)}\n    set ${s.name}(value: ${valType(s)}) { this.${del}(${args}); }\n`;
}

function asyncReader(s) {
    const args = s.kind === 'bit' ? readBitArgs(s) : readArgs(s);
    const del = s.kind === 'bit' ? 'bit' : s.read;
    const ret = (s.kind === 'int' && s.width === 64) ? 'Promise<alwaysBigInt extends true ? bigint : BigValue>' : 'Promise<number>';
    return `    ${jsdoc(s, false)}\n    async ${s.name}(): ${ret} { return await this.${del}(${args}); }\n`;
}

function asyncWriter(s) {
    const args = s.kind === 'bit' ? writeBitArgs(s) : writeArgs(s);
    const del = s.kind === 'bit' ? 'bit' : s.write;
    return `    ${jsdoc(s, true)}\n    async ${s.name}(value: ${valType(s)}) { await this.${del}(${args}); }\n`;
}

export const RENDERERS = { syncReader, syncWriter, asyncReader, asyncWriter };

const all = [...expandNumeric(), ...expandBits()];

/** Every mechanical alias name (271). Used by apply-aliases.mjs to know what to replace. */
export const MECHANICAL_NAMES = new Set(all.map(s => s.name));

const banner = '    // ==== GENERATED from scripts/alias-spec.mjs by `npm run apply:aliases` - do not edit by hand ====\n'
    + '    // Behaviour is verified by test/aliases.parity.test.ts.\n\n';

/** Full alias block for one facade kind (banner + members). */
export function renderMembers(kind) {
    return banner + all.map(RENDERERS[kind]).join('\n');
}
