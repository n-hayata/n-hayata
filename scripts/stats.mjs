// GitHub の実績を GraphQL で取り、assets/stats-{light,dark}.svg を書き出す。
// 集計値のみを扱う（repo 名・org 名・顧客名は一切出さない）。
//   GITHUB_TOKEN=<classic PAT: read:user, repo> node scripts/stats.mjs
import { writeFileSync } from 'node:fs';
import { SANS, THEMES, grain, wash, ground, esc } from './theme.mjs';

const LOGIN = 'n-hayata';
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN is required');

const QUERY = `{
  viewer {
    login
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalRepositoriesWithContributedCommits
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
    }
  }
}`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { authorization: `bearer ${token}`, 'content-type': 'application/json' },
  body: JSON.stringify({ query: QUERY }),
});
if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
const body = await res.json();
if (body.errors) throw new Error(`GraphQL: ${JSON.stringify(body.errors)}`);

const viewer = body.data.viewer;
// GITHUB_TOKEN（Actions の bot トークン）だとプライベート分が落ちて数字が激減する。
// 黙って小さい数字を出すより落とす。
if (viewer.login !== LOGIN) {
  throw new Error(`expected viewer ${LOGIN} but got ${viewer.login} — 本人の PAT を STATS_TOKEN に入れてください`);
}

const c = viewer.contributionsCollection;
const days = c.contributionCalendar.weeks.flatMap((w) => w.contributionDays);

/** 当日は集計途中なので、0 なら起点から外す */
function currentStreak() {
  let i = days.length - 1;
  if (days[i]?.contributionCount === 0) i -= 1;
  let n = 0;
  for (; i >= 0 && days[i].contributionCount > 0; i -= 1) n += 1;
  return n;
}
function longestStreak() {
  let best = 0, run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

/** 活動量が変わっても階調が潰れないよう、非ゼロ日の分位で刻む */
function thresholds() {
  const v = days.map((d) => d.contributionCount).filter((n) => n > 0).sort((a, b) => a - b);
  if (!v.length) return [1, 2, 3, 4];
  const q = (p) => v[Math.min(v.length - 1, Math.floor(v.length * p))];
  return [q(0.25), q(0.5), q(0.75), q(0.9)];
}
const TH = thresholds();
const level = (n) => (n === 0 ? 0 : n <= TH[0] ? 1 : n <= TH[1] ? 2 : n <= TH[2] ? 3 : 4);

const nf = new Intl.NumberFormat('en-US');
const METRICS = [
  ['CONTRIBUTIONS', c.contributionCalendar.totalContributions],
  ['COMMITS',       c.totalCommitContributions],
  ['PULL REQUESTS', c.totalPullRequestContributions],
  ['REVIEWS',       c.totalPullRequestReviewContributions],
  ['REPOSITORIES',  c.totalRepositoriesWithContributedCommits],
];

const W = 1200, H = 400, X0 = 96, INNER = 1008;
const CELL = 15, GAP = 4, GRID_Y = 214;
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function svg(t, i) {
  const step = INNER / METRICS.length;
  const cells = METRICS.map(([label, value], k) => {
    const x = X0 + step * k;
    const rule = k ? `<line x1="${x.toFixed(1)}" y1="52" x2="${x.toFixed(1)}" y2="126" stroke="${t.line}" stroke-width="1"/>` : '';
    return `${rule}
    <text x="${(x + 28).toFixed(1)}" y="72" font-size="10" font-weight="500" letter-spacing="2.6" fill="${t.ink2}">${label}</text>
    <text x="${(x + 26).toFixed(1)}" y="122" font-size="38" font-weight="200" letter-spacing="0.5" fill="${t.ink}">${nf.format(value)}</text>`;
  }).join('');

  let squares = '', ticks = '', seenMonth = -1;
  c.contributionCalendar.weeks.forEach((week, wi) => {
    const x = X0 + wi * (CELL + GAP);
    for (const d of week.contributionDays) {
      const y = GRID_Y + d.weekday * (CELL + GAP);
      squares += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="1.5" fill="${t.heat[level(d.contributionCount)]}"/>`;
    }
    const first = week.contributionDays[0];
    const m = Number(first.date.slice(5, 7)) - 1;
    // 月が変わった最初の週にだけ、ごく静かな見出しを置く
    if (m !== seenMonth && Number(first.date.slice(8, 10)) <= 7) {
      seenMonth = m;
      ticks += `<text x="${x}" y="${GRID_Y + 7 * (CELL + GAP) + 22}" font-size="9" font-weight="500" letter-spacing="1.8" fill="${t.ink2}" opacity="0.55">${MONTHS[m]}</text>`;
    }
  });

  const streak = `CURRENT STREAK ${currentStreak()} DAYS · LONGEST ${longestStreak()}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"
  role="img" aria-label="${esc(`${METRICS.map(([l, v]) => `${l} ${v}`).join(', ')} in the last 12 months. ${streak}.`)}">
  <defs>${wash(`wash${i}`, t.wash)}${grain(`grain${i}`, t.grain)}</defs>
  ${ground(t, W, H, i)}
  <g font-family="${SANS}">${cells}
    <line x1="96" y1="170" x2="1104" y2="170" stroke="${t.line}" stroke-width="1"/>
    <text x="96" y="196" font-size="10" font-weight="500" letter-spacing="2.6" fill="${t.ink2}">LAST 12 MONTHS</text>
    <text x="1104" y="196" text-anchor="end" font-size="10" font-weight="500" letter-spacing="2.6" fill="${t.clay}">${streak}</text>
    ${squares}${ticks}
  </g>
</svg>
`;
}

for (const [i, t] of THEMES.entries()) {
  writeFileSync(new URL(`../assets/stats-${t.id}.svg`, import.meta.url), svg(t, i));
}
console.log(METRICS.map(([l, v]) => `${l}=${v}`).join(' '), `| streak ${currentStreak()}/${longestStreak()}`);
