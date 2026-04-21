import { getAppBaseUrl } from '@/lib/config/app-url'

export const APP_URL = getAppBaseUrl()

// ─────────────────────────────────────────────────────────────────────────────
// 🎨 EMAIL THEME — change everything here, all emails update automatically
// ─────────────────────────────────────────────────────────────────────────────
export const THEME = {
  // Sender
  from:           'Muuday <noreply@muuday.com>',

  // Brand colors
  primary:        '#22c55e',   // green — hero bg, CTA button, logo, links
  primaryLight:   '#dcfce7',   // light green — highlight box bg, feature icons
  primaryDark:    '#14532d',   // dark green — highlight box text
  primaryMid:     '#22c55e',   // border accent on highlight box

  // Backgrounds
  pageBg:         '#f8fafc',   // outer page background
  cardBg:         '#ffffff',   // email card background
  footerBg:       '#fafaf8',   // footer background

  // Text
  textDark:       '#1e1d18',   // headings, strong text
  textBody:       '#3d3c36',   // body text
  textMuted:      '#9b9789',   // footer, subtitles
  textSecondary:  '#5c5a52',   // feature descriptions, footer links

  // Status colors
  successBg:      '#f0fdf4',
  successBorder:  '#bbf7d0',
  successText:    '#15803d',
  warnBg:         '#fff7ed',
  warnBorder:     '#fed7aa',
  warnText:       '#c2410c',
  dangerBg:       '#fef2f2',
  dangerBorder:   '#fecaca',
  dangerText:     '#b91c1c',
  starsBg:        '#fefce8',
  starsBorder:    '#fef08a',
  starsText:      '#713f12',

  // Logo
  logoChar:       'm',         // character shown in the logo square
  logoName:       'muuday',    // brand name shown below logo
  logoRadius:     '14px',

  // Typography
  fontFamily:     "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontImport:     "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",

  // Social links in footer
  instagram:      'https://instagram.com/usemuuday',
  contact:        'hello@muuday.com',

  // Signoff
  signoffText:    'Qualquer dúvida, responde este email. A gente lê tudo.',
  signoffName:    'Equipe Muuday',
  signoffRole:    'muuday.com',

  // Footer tagline
  tagline:        'Especialistas brasileiros, onde você estiver.',
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Shared layout ────────────────────────────────────────────────────────
export function emailLayout(heroBadge: string, heroTitle: string, body: string) {
  const T = THEME
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<style>
  @import url('${T.fontImport}');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background-color:${T.pageBg};font-family:${T.fontFamily};-webkit-font-smoothing:antialiased;color:${T.textDark};}
  .ew{background-color:${T.pageBg};padding:40px 16px;}
  .ec{max-width:600px;margin:0 auto;}
  .eh{text-align:center;padding:0 0 32px;}
  .lm{display:inline-block;background-color:${T.primary};border-radius:${T.logoRadius};width:48px;height:48px;line-height:48px;text-align:center;font-size:22px;font-weight:800;color:#fff;font-family:${T.fontFamily};letter-spacing:-0.03em;}
  .lt{display:block;font-size:20px;font-weight:700;color:${T.primary};letter-spacing:-0.02em;margin-top:10px;}
  .card{background-color:${T.cardBg};border-radius:24px;overflow:hidden;border:1px solid rgba(30,29,24,0.08);}
  .hero{background-color:${T.primary};padding:40px 48px 36px;position:relative;overflow:hidden;}
  .badge{display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:999px;padding:4px 14px;font-size:12px;font-weight:600;color:#fff;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:16px;}
  .htitle{font-size:28px;font-weight:700;color:#fff;line-height:1.25;letter-spacing:-0.02em;margin:0;position:relative;z-index:1;}
  .bd{padding:40px 48px;}
  .greet{font-size:16px;font-weight:600;color:${T.textDark};margin-bottom:20px;}
  .bt{font-size:15px;color:${T.textBody};line-height:1.7;margin-bottom:18px;}
  .bt strong{font-weight:600;color:${T.textDark};}
  .hbox{background-color:${T.primaryLight};border-left:3px solid ${T.primaryMid};border-radius:0 12px 12px 0;padding:16px 20px;margin:24px 0;}
  .hbox p{font-size:15px;font-weight:500;color:${T.primaryDark};line-height:1.6;margin:0;}
  .ibox{background:#f9f9f7;border:1px solid rgba(30,29,24,0.08);border-radius:16px;padding:20px 24px;margin:20px 0;}
  .ibox table{width:100%;border-collapse:collapse;}
  .ibox td{padding:8px 0;font-size:14px;border-bottom:1px solid #f0ede6;}
  .ibox tr:last-child td{border-bottom:none;}
  .ibox .ilabel{color:${T.textMuted};}
  .ibox .ival{color:${T.textDark};font-weight:600;text-align:right;}
  .flist{list-style:none;margin:24px 0;padding:0;}
  .fi{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #f0ede6;}
  .fi:last-child{border-bottom:none;}
  .ficon{width:32px;height:32px;min-width:32px;background-color:${T.primaryLight};border-radius:8px;text-align:center;line-height:32px;font-size:15px;}
  .ftitle{font-size:14px;font-weight:600;color:${T.textDark};margin-bottom:2px;}
  .fdesc{font-size:13px;color:${T.textSecondary};line-height:1.5;margin:0;}
  .ctaw{text-align:center;margin:32px 0 8px;}
  .cta{display:inline-block;background-color:${T.primary};color:#fff !important;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:999px;letter-spacing:-0.01em;}
  .ctasub{display:block;text-align:center;font-size:13px;color:${T.textMuted};margin-top:12px;}
  .div{height:1px;background-color:#f0ede6;margin:32px 0;}
  .so{margin-top:32px;}
  .sotext{font-size:15px;color:${T.textBody};line-height:1.7;margin-bottom:16px;}
  .soname{font-size:15px;font-weight:600;color:${T.textDark};margin-bottom:2px;}
  .sorole{font-size:13px;color:${T.textMuted};}
  .foot{padding:28px 48px;background-color:${T.footerBg};border-top:1px solid rgba(30,29,24,0.06);}
  .flogo{font-size:16px;font-weight:700;color:${T.primary};letter-spacing:-0.02em;margin-bottom:8px;}
  .ftag{font-size:13px;color:${T.textMuted};margin-bottom:20px;line-height:1.5;}
  .flinks{margin-bottom:16px;}
  .flinks a{font-size:13px;color:${T.textSecondary};text-decoration:none;margin-right:16px;}
  .unsub{font-size:12px;color:${T.textMuted};margin-top:8px;}
  .unsub a{color:${T.textMuted};text-decoration:underline;}
  .warn{background:${T.warnBg};border:1px solid ${T.warnBorder};border-radius:12px;padding:16px 20px;margin:16px 0;}
  .warn p{font-size:14px;font-weight:600;color:${T.warnText};margin:0;}
  .danger{background:${T.dangerBg};border:1px solid ${T.dangerBorder};border-radius:12px;padding:16px 20px;margin:16px 0;}
  .danger p{font-size:14px;color:${T.dangerText};margin:0;}
  .success{background:${T.successBg};border:1px solid ${T.successBorder};border-radius:12px;padding:16px 20px;margin:16px 0;}
  .success p{font-size:14px;font-weight:600;color:${T.successText};margin:0;}
  .stars{background:${T.starsBg};border:1px solid ${T.starsBorder};border-radius:12px;padding:20px 24px;margin:16px 0;}
  @media(max-width:600px){.ew{padding:24px 12px;}.hero{padding:28px 24px;}.bd{padding:28px 24px;}.foot{padding:24px;}.htitle{font-size:22px;}.cta{padding:14px 32px;font-size:14px;}}
</style>
</head>
<body>
<div class="ew">
  <div class="ec">
    <div class="eh">
      <span class="lm">${T.logoChar}</span>
      <span class="lt">${T.logoName}</span>
    </div>
    <div class="card">
      <div class="hero">
        <div class="badge">${heroBadge}</div>
        <h1 class="htitle">${heroTitle}</h1>
      </div>
      <div class="bd">
        ${body}
      </div>
      <div class="foot">
        <div class="flogo">${T.logoName}</div>
        <div class="ftag">${T.tagline}</div>
        <div class="flinks">
          <a href="${APP_URL}">Website</a>
          <a href="${T.instagram}">Instagram</a>
          <a href="mailto:${T.contact}">Contato</a>
        </div>
        <div class="unsub">Não quer mais receber estes emails? <a href="${APP_URL}/configuracoes">Cancelar subscrição</a></div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`
}

export function cta(href: string, label: string, sub?: string) {
  return `<div class="ctaw">
    <a href="${href}" class="cta">${label}</a>
    ${sub ? `<span class="ctasub">${sub}</span>` : ''}
  </div>`
}

export function infoBox(rows: { label: string; value: string }[]) {
  return `<div class="ibox"><table>${rows.map(r =>
    `<tr><td class="ilabel">${r.label}</td><td class="ival">${r.value}</td></tr>`
  ).join('')}</table></div>`
}

export function signoff() {
  return `<div class="div"></div>
  <div class="so">
    <p class="sotext">${THEME.signoffText}</p>
    <p class="soname">${THEME.signoffName}</p>
    <p class="sorole">${THEME.signoffRole}</p>
  </div>`
}

export function from() { return THEME.from }
