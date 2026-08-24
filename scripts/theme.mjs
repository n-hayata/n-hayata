// Shared design tokens — "soft minimalism" (Norm Architects 系)
// 純黒・純白は使わない。差し色は clay 1色のみ。
export const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Helvetica,Arial,'Hiragino Sans','Noto Sans JP',sans-serif";
export const SERIF =
  "Baskerville,'Hoefler Text','Times New Roman',Georgia,'Hiragino Mincho ProN',serif";

export const LIGHT = {
  id: 'light',
  paper: '#FAF8F4', // 石灰プラスター（GitHub の白から板状に浮かない濃度）
  line:  '#DCD5C9', // ヘアライン
  ink:   '#35322D', // ソート
  ink2:  '#7E766B', // 温かいグレー
  clay:  '#A78F73', // 唯一の差し色
  wash:  ['#FFFFFF', 0.9, '#C9BFAE', 0.22], // 左上から差す光と、右下へ落ちる影
  grain: 0.05,
  heat: ['#E8E2D7', '#D5C9B3', '#BEAC90', '#A18A6A', '#7B674B'],
  oat:   '#EAE4DA', // アバターの地（白背景に対して輪郭が出る深さ）
};

export const DARK = {
  id: 'dark',
  paper: '#131211', // 温かみのある墨（#000 は使わない）
  line:  '#35302B',
  ink:   '#E9E3D8',
  ink2:  '#8F877B',
  clay:  '#B79E80',
  wash:  ['#FFFFFF', 0.05, '#000000', 0.30],
  grain: 0.07,
  heat: ['#262320', '#3E372E', '#5B5040', '#806D53', '#A8906C'],
};

export const THEMES = [LIGHT, DARK];

/** 紙・漆喰の肌を出す微細なグレイン */
export const grain = (id, opacity) => `<filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="7"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="${opacity}"/></feComponentTransfer>
  </filter>`;

/** 左上から差す光と、右下へ落ちる影。漆喰の面に光が回る感じを出す */
export const wash = (id, [lit, litOpacity, shade, shadeOpacity]) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${lit}" stop-opacity="${litOpacity}"/>
    <stop offset="0.55" stop-color="${lit}" stop-opacity="0"/>
    <stop offset="1" stop-color="${shade}" stop-opacity="${shadeOpacity}"/>
  </linearGradient>`;

/** 地の3層（紙・光・グレイン） */
export const ground = (t, w, h, i) =>
  `<rect width="${w}" height="${h}" fill="${t.paper}"/>` +
  `<rect width="${w}" height="${h}" fill="url(#wash${i})"/>` +
  `<rect width="${w}" height="${h}" filter="url(#grain${i})"/>`;

/** SVG は XML なので、テキストに混ざる & < > は必ず落とす */
export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
