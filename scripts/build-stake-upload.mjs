import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import * as zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { modeBooks, secondChanceBooks, secondChanceMode, targetMode, SAMPLE_COUNT, samplesAtLeast, SUPPORTED_TARGETS } from '../stacks-3d-home/engine-contract.mjs';

if (!zlib.zstdCompressSync) throw new Error('Use Node.js 24 or newer to create the Zstandard math files.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'stacks-3d-home');
const args = process.argv.slice(2);
const frontendOnly = args.includes('--frontend-only');
const outputIndex = args.indexOf('--output');
if (outputIndex >= 0 && !args[outputIndex + 1]) throw new Error('--output requires a new directory path.');
const output = outputIndex >= 0 ? path.resolve(args[outputIndex + 1]) : path.join(root, 'output', 'stacks-engine-' + new Date().toISOString().replace(/[:.]/g, '-'));
if (fs.existsSync(output)) throw new Error('Output already exists. Choose a new directory; previous releases are preserved.');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.mkdirSync(output);
const frontend = path.join(output, 'frontend');
fs.mkdirSync(frontend);
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.cpSync(from, to, { recursive: true }); };
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');

for (const name of fs.readdirSync(source)) {
  if (/\.(css|m?js)$/.test(name) && !name.endsWith('.test.mjs')) copy(path.join(source, name), path.join(frontend, name));
}
let html = fs.readFileSync(path.join(source, 'index.html'), 'utf8');
assert(html.includes('<head>'));
html = html.replace('<head>', '<head>\n    <meta name="stacks-runtime" content="stake-engine">');
fs.writeFileSync(path.join(frontend, 'index.html'), html);
for (const item of ['vendor', 'assets/arcade', 'assets/audio', 'assets/logo-velocity.png']) copy(path.join(source, item), path.join(frontend, item));
console.log(`Frontend exported: ${frontend}`);
if (frontendOnly) process.exit(0);

const math = path.join(output, 'math');
fs.mkdirSync(math);
const modes = [], checksums = [], statistics = ['mode,target,rtp_percent,win_probability,total_weight,outcomes,max_win_event,loss_event'];
let totalOutcomes = 0, mathBytes = 0;
let minRtp = Infinity, maxRtp = 0;
function mathFile(name, contents) {
  const buffer = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  fs.writeFileSync(path.join(math, name), buffer);
  mathBytes += buffer.length;
  checksums.push(`${createHash('sha256').update(buffer).digest('hex')}  math/${name}`);
}

const modeDefinitions = SUPPORTED_TARGETS.flatMap(target => [
  { name: targetMode(target), target, cost: 1, rows: modeBooks(target), secondChance: false },
  { name: secondChanceMode(target), target, cost: 2, rows: secondChanceBooks(target), secondChance: true },
]);
for (const [targetIndex, definition] of modeDefinitions.entries()) {
  const { name, target, cost, rows, secondChance } = definition;
  let weight = 0n, wins = 0n;
  const books = [], csv = [];
  for (const { book, weight: count } of rows) {
    assert(count > 0n);
    assert.equal(book.id, books.length);
    assert.equal(book.events[1].amount, book.payoutMultiplier);
    const results = book.events[0].attempts || [book.events[0].resultUnits];
    assert.equal(Boolean(book.payoutMultiplier), results.some(result => result >= target));
    weight += count;
    if (book.payoutMultiplier) wins += count;
    books.push(JSON.stringify(book));
    csv.push(`${book.id},${count},${book.payoutMultiplier}`);
  }
  assert.equal(weight, SAMPLE_COUNT);
  if (!secondChance) assert.equal(wins, samplesAtLeast(target));
  const plain = Buffer.from(books.join('\n') + '\n');
  const compressed = zlib.zstdCompressSync(plain, { params: { [zlib.constants.ZSTD_c_compressionLevel]: 3 } });
  assert(zlib.zstdDecompressSync(compressed).equals(plain));
  const events = `books_${name}.jsonl.zst`, weights = `lookUpTable_${name}_0.csv`;
  mathFile(events, compressed);
  mathFile(weights, csv.join('\n') + '\n');
  modes.push({ name, cost, events, weights });
  totalOutcomes += rows.length;
  const maxPayout = Math.max(...rows.map(row => row.book.payoutMultiplier));
  const rtp = Number(wins) / Number(weight) * maxPayout / cost;
  minRtp = Math.min(minRtp, rtp); maxRtp = Math.max(maxRtp, rtp);
  statistics.push(`${name},${(target / 100).toFixed(2)},${rtp.toFixed(9)},${Number(wins) / Number(weight)},${weight},${rows.length},${maxPayout / 100},${rows.find(row => !row.book.payoutMultiplier).book.id}`);
  if ((targetIndex + 1) % 10 === 0) console.log(`Math: ${targetIndex + 1}/${modeDefinitions.length} modes verified and written`);
}
mathFile('index.json', JSON.stringify({ modes }) + '\n');
fs.writeFileSync(path.join(output, 'MODE-STATISTICS.csv'), statistics.join('\n') + '\n');

const branding = path.join(output, 'branding');
fs.mkdirSync(branding);
for (const name of ['varchas-games-transparent.png', 'varchas-games-white.svg']) copy(path.join(source, 'assets/brand', name), path.join(branding, name));
copy(path.join(source, 'assets/logo-velocity.png'), path.join(branding, 'stacks-logo.png'));

const report = {
  game: 'STACKS', publisher: 'VARCHAS Games', generatedAt: new Date().toISOString(),
  status: 'integration-test-build-not-production-approved',
  targetRange: { minimum: Math.min(...SUPPORTED_TARGETS) / 100, maximum: Math.max(...SUPPORTED_TARGETS) / 100, schedule: 'Nine standard modes and nine 2x-cost Second Chance modes', count: modes.length },
  mathFiles: 1 + modes.length * 2, totalOutcomes, mathBytes,
  totalWeightPerMode: String(SAMPLE_COUNT), rtpPercentRange: [minRtp, maxRtp],
  verification: { everyModeWeightsSumTo2Pow32: true, everyModeRtpIs965Percent: true, allBookCsvPayoutsMatch: true, allZstdFilesRoundTrip: true },
  revealModel: 'Standard modes use representative entropy-interval midpoints. Second Chance modes encode one or two deterministic attempts and preserve 96.5% RTP at a 2x cost.',
  pending: ['Stake Engine acceptance of the configured mode count is unverified.', 'Real RGS session/currency and dashboard upload tests have not been performed.', 'Platform approval, social-mode terminology, and full jurisdiction requirements need review.'],
  sources: ['https://stake-engine.com/docs/math/math-file-format', 'https://stake-engine.com/docs/rgs/wallet', 'https://stake-engine.com/docs/approval-guidelines/game-replay-requirements'],
};
writeJson(path.join(output, 'MATH-REPORT.json'), report);
fs.writeFileSync(path.join(output, 'UPLOAD-INSTRUCTIONS.md'), `# STACKS Upload Files\n\nStatus: Version 4 integration test build, not production approved.\n\n## Frontend\n\nExtract frontend.zip. In Stake Engine Files > Import Files > Frontend, select the contents of the extracted frontend directory. index.html must be at the upload root. Include every JS/MJS/CSS file plus assets/ and vendor/ with their relative paths.\n\nThe exported frontend requires an Engine launch URL (sessionID and rgs_url), or a public replay URL.\n\n## Math\n\nExtract math.zip. In Files > Import Files > Math, select all ${1 + modeDefinitions.length * 2} contents of math/. It contains index.json plus one event book and lookup table for each of ${modeDefinitions.length} Engine modes. target_250 is standard 2.50x; second_chance_250 is its 2x-cost Second Chance mode. Retain exact names.\n\nThe local prediction control moves smoothly in 0.01x increments. Stake wallet rounds can use only the modes contained in this math package. The ZIP files are delivery containers; use the extracted folder if the uploader requests files.\n\n## Branding\n\nbranding/varchas-games-transparent.png is the background-free publisher logo. stacks-logo.png is the game logo.\n\n## Verification\n\nMATH-REPORT.json records mathematical verification. SHA256SUMS.txt identifies exported files. Test frontend and math together in the dashboard before production approval.\n\n## Rebuild\n\nFrom the original project with Node.js 24+: node scripts/build-stake-upload.mjs\n`);

function filesBelow(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => entry.isDirectory() ? filesBelow(path.join(directory, entry.name), prefix + entry.name + '/') : [prefix + entry.name]);
}
for (const folder of ['frontend', 'branding']) {
  for (const name of filesBelow(path.join(output, folder))) {
    const data = fs.readFileSync(path.join(output, folder, name));
    checksums.push(`${createHash('sha256').update(data).digest('hex')}  ${folder}/${name}`);
  }
}
fs.writeFileSync(path.join(output, 'SHA256SUMS.txt'), checksums.join('\n') + '\n');
function zip(name, cwd, entries) {
  console.log(`Packaging ${name}`);
  const result = spawnSync('zip', ['-q', '-X', '-r', path.join(output, name), ...entries], { cwd, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr || 'zip failed');
  const test = spawnSync('unzip', ['-tqq', path.join(output, name)], { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 });
  if (test.status !== 0) throw new Error(test.stderr || 'ZIP validation failed');
}
zip('frontend.zip', frontend, ['.']);
zip('math.zip', math, ['.']);
zip('all-files.zip', output, ['frontend.zip', 'math.zip', 'branding', 'MATH-REPORT.json', 'MODE-STATISTICS.csv', 'UPLOAD-INSTRUCTIONS.md', 'SHA256SUMS.txt']);
console.log(JSON.stringify({ output, targets: modes.length, mathFiles: report.mathFiles, totalOutcomes, mathBytes, rtpPercentRange: report.rtpPercentRange }, null, 2));
