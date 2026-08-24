// ヒーローとナビラベルを生成する（内容が変わったときだけ手で流す）
//   node scripts/build-static.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { SANS, SERIF, THEMES, grain, wash, ground, esc } from './theme.mjs';

const OUT = new URL('../assets/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const W = 1200, H = 340;
const ROLE    = 'DIRECTOR & CTO';
const COMPANY = 'TRIPLE THREE INC.';
const NAME    = 'Hayata';
const TAGLINE = '外食産業のためのSaaS群を、少人数 × AI前提でつくっています。';

/** アバターと同じセリフの n の右肩に、脚注のような clay の + を添える */
const mark = (t) => `<g font-family="${SERIF}">
    <text x="1078" y="176" text-anchor="end" font-size="96" fill="${t.ink}">n</text>
    <text x="1084" y="134" font-size="34" fill="${t.clay}">+</text>
  </g>`;

const hero = (t, i) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"
  role="img" aria-label="${esc(`${NAME} — ${ROLE}, ${COMPANY}. ${TAGLINE}`)}">
  <defs>${wash(`wash${i}`, t.wash)}${grain(`grain${i}`, t.grain)}</defs>
  ${ground(t, W, H, i)}
  <g font-family="${SANS}">
    <text x="96"  y="106" font-size="11" font-weight="500" letter-spacing="3.4" fill="${t.ink2}">${COMPANY}</text>
    <text x="286" y="106" font-size="11" font-weight="500" letter-spacing="3.4" fill="${t.clay}">${esc(ROLE)}</text>
    <text x="96" y="196" font-family="${SERIF}" font-size="74" letter-spacing="0.5" fill="${t.ink}">${NAME}</text>
    <text x="96"  y="242" font-size="14.5" letter-spacing="0.4" fill="${t.ink2}">${TAGLINE}</text>
  </g>
  <line x1="96" y1="284" x2="1104" y2="284" stroke="${t.line}" stroke-width="1"/>
  ${mark(t)}
</svg>
`;

// ナビ: markdown のリンクは青くなり パレットが崩れるので、ラベルごとに小さな SVG を作って <a> で包む
const NAV = [
  { slug: 'linkedin',  label: 'LinkedIn',    w: 132 },
  { slug: 'blog',      label: 'Tech Blog',   w: 140 },
  { slug: 'site',      label: '333-inc.com', w: 168 },
  { slug: 'recruit',   label: '採用情報',     w: 132 },
];

const nav = (t, n) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n.w} 40" role="img" aria-label="${n.label}">
  <text x="${n.w / 2}" y="25" text-anchor="middle" font-family="${SANS}"
    font-size="13" font-weight="400" letter-spacing="1.9" fill="${t.ink2}">${n.label}</text>
</svg>
`;

for (const [i, t] of THEMES.entries()) {
  writeFileSync(new URL(`hero-${t.id}.svg`, OUT), hero(t, i));
  for (const n of NAV) writeFileSync(new URL(`nav-${n.slug}-${t.id}.svg`, OUT), nav(t, n));
}
console.log('assets: hero + nav written');

// アバター（512px）。GitHub のアバターは API 非対応なので、PNG に焼いて Web UI から上げる。
const avatar = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="${NAME}">
  <defs>${wash('washA', ['#FFFFFF', 0.55, '#A8967C', 0.22])}${grain('grainA', 0.055)}</defs>
  ${ground({ ...THEMES[0], paper: THEMES[0].oat }, 512, 512, 'A')}
  <text x="256" y="368" text-anchor="middle" font-family="${SERIF}"
    font-size="330" fill="#3A362F">n</text>
  <rect width="512" height="512" filter="url(#grainA)"/>
</svg>
`;
writeFileSync(new URL('avatar.svg', OUT), avatar);
console.log('assets: avatar written');
