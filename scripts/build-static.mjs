// ヒーローとナビラベルとアバターを生成する（内容が変わったときだけ手で流す）
//   python3 scripts/bake-photos.py   ← 先にこれ（写真を焼く）
//   node scripts/build-static.mjs
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { SANS, SERIF, THEMES, grain, wash, ground, esc } from './theme.mjs';

const OUT = new URL('../assets/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const W = 340, H = 340; // placeholder（下で上書き）
const HERO_W = 1200, HERO_H = 340;
const ROLE    = 'DIRECTOR & CTO';
const COMPANY = 'TRIPLE THREE INC.';
const NAME    = 'Hayata';
const TAGLINE = '外食産業のためのSaaS群を、少人数 × AI前提でつくっています。';

/** 焼いた写真を data URI で埋め込む。GitHub の <img> 文脈では外部参照が読めないため。 */
const photo = (stem, theme) => {
  const b64 = readFileSync(new URL(`${stem}-${theme}.jpg`, OUT)).toString('base64');
  return `data:image/jpeg;base64,${b64}`;
};

/**
 * 文字の側は紙に戻し、右へ向かって写真を出すスクリム。
 * 文字は x<620 に収まるので、そこまではほぼ不透明で置く。
 */
const scrim = (t, id) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${t.paper}" stop-opacity="0.96"/>
    <stop offset="0.42" stop-color="${t.paper}" stop-opacity="0.94"/>
    <stop offset="0.60" stop-color="${t.paper}" stop-opacity="0.55"/>
    <stop offset="0.80" stop-color="${t.paper}" stop-opacity="0.18"/>
    <stop offset="1" stop-color="${t.paper}" stop-opacity="0.04"/>
  </linearGradient>`;

/** アバターと同じセリフの n の右肩に、脚注のような clay の + を添える */
const mark = (t) => `<g font-family="${SERIF}">
    <text x="1078" y="176" text-anchor="end" font-size="96" fill="${t.ink}">n</text>
    <text x="1084" y="134" font-size="34" fill="${t.clay}">+</text>
  </g>`;

const hero = (t, i) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${HERO_W} ${HERO_H}"
  role="img" aria-label="${esc(`${NAME} — ${ROLE}, ${COMPANY}. ${TAGLINE}`)}">
  <defs>${scrim(t, `scrim${i}`)}${grain(`grain${i}`, t.grain)}</defs>
  <rect width="${HERO_W}" height="${HERO_H}" fill="${t.paper}"/>
  <image href="${photo('photo-hero', t.id)}" x="0" y="0" width="${HERO_W}" height="${HERO_H}"
    preserveAspectRatio="xMidYMid slice"/>
  <rect width="${HERO_W}" height="${HERO_H}" fill="url(#scrim${i})"/>
  <rect width="${HERO_W}" height="${HERO_H}" filter="url(#grain${i})"/>
  <g font-family="${SANS}">
    <text x="96"  y="106" font-size="11" font-weight="500" letter-spacing="3.4" fill="${t.ink2}">${COMPANY}</text>
    <text x="286" y="106" font-size="11" font-weight="500" letter-spacing="3.4" fill="${t.clay}">${esc(ROLE)}</text>
    <text x="96"  y="242" font-size="14.5" letter-spacing="0.4" fill="${t.ink2}">${TAGLINE}</text>
  </g>
  <text x="96" y="196" font-family="${SERIF}" font-size="74" letter-spacing="0.5" fill="${t.ink}">${NAME}</text>
  <line x1="96" y1="284" x2="620" y2="284" stroke="${t.line}" stroke-width="1"/>
  ${mark(t)}
</svg>
`;

/**
 * ナビ。markdown リンクの青を避けてパレットを保つためラベルを SVG にしている。
 * viewBox の高さ = README の height 指定と一致させる（縮小されると文字が潰れる）。
 * 下線は「押せる」ことを示すため。色は clay = 操作できる要素、と決めている。
 */
const NAV_H = 36;
const NAV = [
  { slug: 'linkedin', label: 'LinkedIn',    w: 108 },
  { slug: 'blog',     label: 'Tech Blog',   w: 116 },
  { slug: 'site',     label: '333-inc.com', w: 136 },
  { slug: 'recruit',  label: '採用情報',     w: 104 },
];

const nav = (t, n) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n.w} ${NAV_H}"
  role="img" aria-label="${esc(n.label)}">
  <text x="${n.w / 2}" y="21" text-anchor="middle" font-family="${SANS}"
    font-size="14" letter-spacing="0.5" fill="${t.ink}">${esc(n.label)}</text>
  <line x1="16" y1="29" x2="${n.w - 16}" y2="29" stroke="${t.clay}" stroke-width="1"/>
</svg>
`;

for (const [i, t] of THEMES.entries()) {
  writeFileSync(new URL(`hero-${t.id}.svg`, OUT), hero(t, i));
  for (const n of NAV) writeFileSync(new URL(`nav-${n.slug}-${t.id}.svg`, OUT), nav(t, n));
}

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
console.log('assets: hero + nav + avatar written');
