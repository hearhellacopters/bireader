/**
 * Replaces the generated mechanical-alias block in the four facades with a fresh render
 * from scripts/alias-spec.mjs (via alias-render.mjs).
 *
 *   node scripts/apply-aliases.mjs
 *
 * The generated block is delimited by `#region Generated mechanical aliases` … `#endregion`
 * and detected structurally (its members are single-statement delegations to the engine
 * primitives), so renaming/adding/removing aliases in the spec is handled correctly - the
 * whole region is swapped. On the first run (no region yet) it falls back to removing the
 * hand-written mechanical members by name. Irregular members (constructor, create,
 * bit()/ubit()/string(), string-family aliases) are always left untouched.
 * test/aliases.parity.test.ts + the full suite prove the swap is behaviour-preserving.
 */
import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MECHANICAL_NAMES, renderMembers } from './alias-render.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REGION_START = '// #region Generated mechanical aliases';
const REGION_END = '// #endregion Generated mechanical aliases';

// The engine primitives a generated alias delegates to (via `this.X(...)`).
const GENERATED_DELEGATES = new Set([
    'readByte', 'readInt16', 'readInt32', 'readInt64', 'readFloat', 'readHalfFloat', 'readDoubleFloat', 'bit',
    'writeByte', 'writeInt16', 'writeInt32', 'writeInt64', 'writeFloat', 'writeHalfFloat', 'writeDoubleFloat',
]);

const targets = [
    { file: 'src/BiReader.ts', kind: 'syncReader' },
    { file: 'src/BiWriter.ts', kind: 'syncWriter' },
    { file: 'src/BiReaderAsync.ts', kind: 'asyncReader' },
    { file: 'src/BiWriterAsync.ts', kind: 'asyncWriter' },
];

/** The engine method a member's single-statement body delegates to, or null. */
function delegateOf(member, sf) {
    if (!member.body) return null;
    const text = member.body.getText(sf).replace(/\s+/g, ' ').trim();
    const m = text.match(/^\{ (?:return )?(?:await )?this\.([A-Za-z0-9_$]+)\(/);
    return m ? m[1] : null;
}

function classMembers(sf) {
    const members = [];
    (function visit(node) {
        if (ts.isClassDeclaration(node)) members.push(...node.members);
        ts.forEachChild(node, visit);
    })(sf);
    return members;
}

/** The wrapped block to insert (region markers + generated members). */
function wrappedBlock(kind) {
    return `    //\n    ${REGION_START}\n    //\n\n${renderMembers(kind)}\n    ${REGION_END}\n`;
}

for (const { file, kind } of targets) {
    const abs = path.join(root, file);
    const src = fs.readFileSync(abs, 'utf8');
    const sf = ts.createSourceFile(abs, src, ts.ScriptTarget.Latest, true);
    const members = classMembers(sf);

    const regionPos = src.indexOf(REGION_START);

    if (regionPos !== -1) {
        // Region path: replace the whole existing generated region.
        // Removal start = beginning of the region's leading decorative comment block.
        let removeStart = src.lastIndexOf('\n', regionPos) + 1;
        const prevLineStart = src.lastIndexOf('\n', removeStart - 2) + 1;
        if (src.slice(prevLineStart, removeStart).trim() === '//') removeStart = prevLineStart;

        // Removal end = the last member in the contiguous run of generated delegations.
        const run = [];
        let started = false;
        for (const m of members) {
            if (m.getStart(sf) < regionPos) continue;
            const del = delegateOf(m, sf);
            if (del && GENERATED_DELEGATES.has(del)) { run.push(m); started = true; }
            else if (started) break;
        }
        if (run.length === 0) {
            console.log(`${file}: region marker found but no generated members - skipped`);
            continue;
        }
        let removeEnd = run[run.length - 1].getEnd();

        // Swallow a trailing #endregion marker line, if present.
        const tail = src.slice(removeEnd);
        const endIdx = tail.indexOf(REGION_END);
        if (endIdx !== -1 && tail.slice(0, endIdx).trim() === '') {
            removeEnd += endIdx + tail.slice(endIdx).indexOf('\n') + 1;
        }

        const out = src.slice(0, removeStart) + wrappedBlock(kind) + src.slice(removeEnd);
        fs.writeFileSync(abs, out);
        console.log(`${file}: replaced generated region (${run.length} members) [${kind}]`);
    } else {
        // First-run path: remove hand-written mechanical members by name, insert the block.
        const spans = [];
        for (const m of members) {
            const name = m.name && m.name.getText(sf);
            if (name && MECHANICAL_NAMES.has(name)) spans.push({ start: m.getFullStart(), end: m.getEnd() });
        }
        if (spans.length === 0) { console.log(`${file}: no mechanical members found (skipped)`); continue; }
        spans.sort((a, b) => a.start - b.start);
        let out = src;
        for (let i = spans.length - 1; i >= 0; i--) {
            out = out.slice(0, spans[i].start) + (i === 0 ? '\n' + wrappedBlock(kind) : '') + out.slice(spans[i].end);
        }
        fs.writeFileSync(abs, out);
        console.log(`${file}: replaced ${spans.length} mechanical members with generated block (${kind})`);
    }
}
