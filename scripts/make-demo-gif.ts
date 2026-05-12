#!/usr/bin/env tsx
/**
 * Generates assets/demo.gif: a small animation of an input field cycling
 * through validation states (idle → typing → valid → invalid → reset).
 *
 * Each frame is rendered as SVG, rasterized via ImageMagick, and stitched
 * into a GIF. Run once before publishing or after restyling.
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const W = 640;
const H = 150;

type State = 'idle' | 'typing' | 'valid' | 'invalid-format' | 'invalid-unknown';

interface Frame {
  typed: string;
  state: State;
  /** centiseconds; gif delay unit */
  delayCs: number;
}

const frames: Frame[] = [
  // intro: empty, hold a beat
  { typed: '', state: 'idle', delayCs: 90 },
  // type 9 0 2 1 0, accelerating
  { typed: '9', state: 'typing', delayCs: 22 },
  { typed: '90', state: 'typing', delayCs: 22 },
  { typed: '902', state: 'typing', delayCs: 22 },
  { typed: '9021', state: 'typing', delayCs: 22 },
  { typed: '90210', state: 'valid', delayCs: 130 },
  // brief reset
  { typed: '', state: 'idle', delayCs: 35 },
  // type a wrong char to show invalid-format
  { typed: '9', state: 'typing', delayCs: 22 },
  { typed: '9X', state: 'invalid-format', delayCs: 130 },
  // brief reset
  { typed: '', state: 'idle', delayCs: 35 },
  // type a well-formed-but-unknown code
  { typed: '9', state: 'typing', delayCs: 22 },
  { typed: '99', state: 'typing', delayCs: 22 },
  { typed: '999', state: 'typing', delayCs: 22 },
  { typed: '9999', state: 'typing', delayCs: 22 },
  { typed: '99999', state: 'invalid-unknown', delayCs: 130 },
];

const COLOR: Record<State, { border: string; bg: string; hint: string; hintText: string }> = {
  idle: {
    border: '#cccccc',
    bg: '#ffffff',
    hint: '#888888',
    hintText: 'enter a postal code',
  },
  typing: {
    border: '#888888',
    bg: '#ffffff',
    hint: '#666666',
    hintText: 'keep typing…',
  },
  valid: {
    border: '#1a7f37',
    bg: '#eaffea',
    hint: '#1a7f37',
    hintText: '✓ valid',
  },
  'invalid-format': {
    border: '#cf222e',
    bg: '#ffeaea',
    hint: '#cf222e',
    hintText: 'invalid characters',
  },
  'invalid-unknown': {
    border: '#cf222e',
    bg: '#ffeaea',
    hint: '#cf222e',
    hintText: 'not a known postal code',
  },
};

function renderSvg(frame: Frame): string {
  const c = COLOR[frame.state];
  // The caret blinks if typing; show a static one for typing frames.
  const showCaret = frame.state === 'typing' || frame.state === 'idle';
  const caretX = 56 + frame.typed.length * 14;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#fafafa"/>
  <text x="48" y="38" font-family="-apple-system, system-ui, sans-serif" font-size="13" fill="#555">Postal code (US)</text>
  <rect x="48" y="50" width="544" height="44" rx="6" ry="6" fill="${c.bg}" stroke="${c.border}" stroke-width="1.5"/>
  <text x="62" y="80" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="18" fill="#111" letter-spacing="2">${escape(frame.typed)}</text>
  ${showCaret && frame.typed.length < 5 ? `<rect x="${caretX}" y="60" width="1.5" height="24" fill="#444"/>` : ''}
  <text x="48" y="116" font-family="-apple-system, system-ui, sans-serif" font-size="13" fill="${c.hint}">${c.hintText}</text>
  <text x="48" y="138" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="#aaa">@d4l/postalcodes</text>
</svg>`;
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

async function main(): Promise<void> {
  const tmpDir = fileURLToPath(new URL('../.tmp/frames/', import.meta.url));
  const assetsDir = fileURLToPath(new URL('../assets/', import.meta.url));
  const outGif = `${assetsDir}demo.gif`;

  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });

  // Write each frame's SVG and assemble the magick argv as we go so we can
  // attach per-frame delays.
  const args: string[] = ['-loop', '0'];
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]!;
    const file = `${tmpDir}f${String(i).padStart(3, '0')}.svg`;
    await writeFile(file, renderSvg(frame));
    args.push('-delay', String(frame.delayCs), file);
  }
  args.push('-layers', 'optimize', outGif);

  console.log(`Rendering ${frames.length} frames via ImageMagick ...`);
  const result = spawnSync('magick', args, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error('ImageMagick failed.');
    process.exit(result.status ?? 1);
  }
  console.log(`Wrote ${outGif}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
