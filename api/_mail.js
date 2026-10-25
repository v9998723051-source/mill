// Письмо покупательнице от Кристины после успешной оплаты — в стиле сайта.
// Отправляется через почту Кристины (SMTP Яндекса). Нужны переменные в Vercel:
// MAIL_USER — адрес (perelyot1991@yandex.ru), MAIL_PASS — пароль приложения Яндекса.
// Если их нет — письмо просто не отправляется, остальное работает.
const nodemailer = require('nodemailer');
const { PLANS, planPrice, rub } = require('./_lib');

const SITE = process.env.SITE_URL || 'https://podlinnost-retreat.vercel.app';
const TG = 'https://t.me/kristinaperelyot';

// Цвета и шрифты сайта
const C = {
  milk: '#F6F1EA', milk2: '#EFE7DC', sand: '#E3D4BF', sandD: '#CDB89B',
  brown: '#7A5640', green: '#2E3F33', green2: '#3B5142', ink: '#2B2620',
  muted: '#6B5D52', onGreen: '#EFE9DF', onGreenMuted: '#C3CCBE',
};
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const DISPLAY = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "Manrope, 'Helvetica Neue', Arial, sans-serif";

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function buildLetter(p) {
  const m = p.metadata || {};
  const paid = Number(p.amount && p.amount.value) || 0;
  const full = m.mode === 'full';
  const plan = PLANS[m.plan] || PLANS.undecided;
  const price = planPrice(m.plan);
  const first = (m.name || '').split(/\s+/)[0] || '';
  const hello = first ? first + ', здравствуйте!' : 'Здравствуйте!';
  const test = m.test === '1';

  const badge = full ? 'Участие оплачено' : 'Место забронировано';
  const lead = full
    ? 'Ваше участие в ретрите оплачено — место за вами. Впереди четыре дня, в которых можно наконец выдохнуть, почувствовать тело и вернуться к себе.'
    : 'Ваше место на ретрите забронировано. Впереди четыре дня, в которых можно наконец выдохнуть, почувствовать тело и вернуться к себе.';
  const rest = !full ? (price && paid < price
    ? { sum: rub(price - paid), text: 'Остаток можно внести до 4 января 2027 включительно. Я напомню заранее и пришлю удобный способ оплаты.' }
    : { sum: null, text: 'Сумму остатка и способ доплаты я подскажу лично. Доплатить нужно до 4 января 2027 включительно.' }) : null;

  const facts = [
    ['Даты', '4–7 февраля 2027'],
    ['Место', 'SABI Club, Валдай'],
    ['Заезд', '4 февраля, 14:00'],
    ['Отъезд', '7 февраля, 16:00 — после обеда'],
    ['Размещение', plan.label],
    ['Оплачено', rub(paid)],
  ];
  if (rest && rest.sum) facts.push(['Остаток', rest.sum]);

  const steps = [
    ['Я напишу вам лично', 'В ближайшие дни — в Telegram или по контакту, который вы оставили.'],
    ['Пришлю памятку', 'Как добраться до Валдая, что взять с собой и как подготовиться.'],
    ['Встретимся 4 февраля', 'Заселение с 14:00. Дальше — просто будьте собой.'],
  ];

  const subject = (test ? '[ТЕСТ] ' : '') + (full
    ? 'Вы едете на ретрит «Подлинность» — оплата получена'
    : 'Ваше место на ретрите «Подлинность» забронировано');
  const preheader = full ? 'Оплата получена — 4–7 февраля 2027, SABI Club, Валдай' : 'Бронь подтверждена — 4–7 февраля 2027, SABI Club, Валдай';

  const text = [
    hello, '', lead, '',
    ...facts.map(f => f[0] + ': ' + f[1]),
    ...(rest ? ['', rest.text] : []), '',
    'Что дальше:', ...steps.map((s, i) => (i + 1) + '. ' + s[0] + ' — ' + s[1]), '',
    'Вопросы — пишите мне в Telegram: @kristinaperelyot (' + TG + ') или просто ответьте на это письмо.', '',
    'Я очень рада, что вы с нами.', 'Кристина Елизарова', '',
    'Сайт ретрита: ' + SITE,
    'Чек об оплате приходит отдельно от ЮKassa. Номер платежа: ' + p.id,
  ].join('\n');

  const row = (k, v, last, strong) => `<tr>
<td style="padding:13px 0;${last ? '' : `border-bottom:1px solid ${C.sand};`}font-family:${SANS};font-size:13px;letter-spacing:.4px;color:${C.muted};width:130px;vertical-align:top">${esc(k)}</td>
<td style="padding:13px 0;${last ? '' : `border-bottom:1px solid ${C.sand};`}font-family:${SANS};font-size:15px;color:${C.ink};${strong ? 'font-weight:700;' : 'font-weight:500;'}vertical-align:top">${esc(v)}</td></tr>`;

  const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${esc(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Manrope:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
<style>
@media (max-width:620px){
 .wrap{width:100%!important}
 .pad{padding-left:24px!important;padding-right:24px!important}
 .h1{font-size:34px!important}
 .stack{display:block!important;width:100%!important;text-align:center!important}
 .stack img{margin:0 auto 14px!important}
}
</style></head>
<body style="margin:0;padding:0;background:${C.milk2};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.milk2}">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.milk2}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:${C.milk};border-radius:22px;overflow:hidden">

${test ? `<tr><td style="background:#B4553A;color:#fff;font-family:${SANS};font-size:12px;letter-spacing:1px;text-align:center;padding:8px">ТЕСТОВОЕ ПИСЬМО — НЕ НАСТОЯЩАЯ БРОНЬ</td></tr>` : ''}

<tr><td class="pad" align="center" style="background:${C.green};padding:40px 44px 34px">
 <div style="font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.onGreenMuted}">Телесный ретрит · Валдай</div>
 <div class="h1" style="font-family:${DISPLAY};font-size:40px;line-height:1.12;color:${C.onGreen};margin:16px 0 0">Подлинность&nbsp;—<br><i>это тотально вы</i></div>
 <div style="font-family:${SERIF};font-size:19px;font-style:italic;color:${C.onGreenMuted};margin:14px 0 0">4–7 февраля 2027 · SABI Club</div>
</td></tr>

<tr><td style="line-height:0;font-size:0"><img src="${SITE}/img/email-hero.jpg" width="600" alt="Закат над озером у бани SABI Club" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>

<tr><td class="pad" style="padding:40px 48px 8px">
 <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#DCE2D3;border-radius:999px;padding:8px 16px;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${C.green}">✓ ${esc(badge)}</td></tr></table>
 <div style="font-family:${SERIF};font-size:30px;line-height:1.2;color:${C.ink};margin:22px 0 12px">${esc(hello)}</div>
 <div style="font-family:${SANS};font-size:16px;line-height:1.65;color:${C.ink}">${esc(lead)}</div>
</td></tr>

<tr><td class="pad" style="padding:28px 48px 8px">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid ${C.sand};border-radius:18px">
  <tr><td style="padding:22px 26px 6px">
   <div style="font-family:${SANS};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${C.brown}">Ваше участие</div>
   <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px">
    ${facts.map((f, i) => row(f[0], f[1], i === facts.length - 1, f[0] === 'Оплачено')).join('')}
   </table>
  </td></tr>
 </table>
 ${rest ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px"><tr><td style="background:${C.milk2};border-left:3px solid ${C.sandD};border-radius:10px;padding:14px 18px;font-family:${SANS};font-size:14px;line-height:1.6;color:${C.muted}">${esc(rest.text)}</td></tr></table>` : ''}
</td></tr>

<tr><td class="pad" style="padding:34px 48px 6px">
 <div style="font-family:${DISPLAY};font-size:26px;color:${C.ink};margin:0 0 18px">Что <i>дальше</i></div>
 ${steps.map((s, i) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px"><tr>
  <td width="46" valign="top"><div style="width:34px;height:34px;line-height:34px;border-radius:50%;background:${C.green};color:${C.onGreen};text-align:center;font-family:${DISPLAY};font-size:16px">${i + 1}</div></td>
  <td valign="top" style="font-family:${SANS};font-size:15px;line-height:1.55;color:${C.ink}"><b style="font-weight:700">${esc(s[0])}</b><br><span style="color:${C.muted}">${esc(s[1])}</span></td>
 </tr></table>`).join('')}
</td></tr>

<tr><td class="pad" style="padding:22px 48px 40px">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.milk2};border-radius:18px"><tr><td style="padding:26px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
   <td class="stack" width="112" valign="top"><img src="${SITE}/img/email-kristina.jpg" width="92" height="92" alt="Кристина Елизарова" style="display:block;width:92px;height:92px;border-radius:50%;border:0;object-fit:cover"></td>
   <td class="stack" valign="top">
    <div style="font-family:${SERIF};font-size:21px;font-style:italic;line-height:1.4;color:${C.ink}">«Я очень рада, что вы с нами. Если появятся вопросы — пишите мне, я всегда на связи».</div>
    <div style="font-family:${SANS};font-size:14px;font-weight:700;color:${C.ink};margin-top:12px">Кристина Елизарова</div>
    <div style="font-family:${SANS};font-size:13px;color:${C.muted}">ведущая ретрита</div>
   </td>
  </tr></table>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px" width="100%"><tr><td align="center">
   <a href="${TG}" style="display:inline-block;background:${C.green};color:${C.onGreen};font-family:${SANS};font-size:15px;font-weight:700;text-decoration:none;padding:15px 30px;border-radius:999px">Написать Кристине в Telegram</a>
   <div style="font-family:${SANS};font-size:13px;color:${C.muted};margin-top:12px">или просто ответьте на это письмо</div>
  </td></tr></table>
 </td></tr></table>
</td></tr>

<tr><td style="line-height:0;font-size:0"><img src="${SITE}/img/email-winter.jpg" width="600" alt="Зимний SABI Club на Валдае" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>
<tr><td class="pad" align="center" style="background:${C.green};padding:30px 44px">
 <div style="font-family:${DISPLAY};font-size:22px;font-style:italic;color:${C.onGreen}">Валдай ждёт вас</div>
 <div style="margin-top:12px"><a href="${SITE}" style="font-family:${SANS};font-size:13px;color:${C.onGreenMuted};text-decoration:underline">Сайт ретрита</a>
 <span style="color:${C.green2}">&nbsp;·&nbsp;</span><a href="${SITE}/oferta.html" style="font-family:${SANS};font-size:13px;color:${C.onGreenMuted};text-decoration:underline">Условия участия</a></div>
</td></tr>
</table>

<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px"><tr><td class="pad" align="center" style="padding:18px 30px 6px;font-family:${SANS};font-size:11px;line-height:1.6;color:#9A8B7D">
Чек об оплате приходит отдельно от ЮKassa. Номер платежа: ${esc(p.id)}<br>
ИП Елизаров Валерий Николаевич · ИНН 694900357981
</td></tr></table>

</td></tr></table>
</body></html>`;
  return { subject, text, html };
}

async function sendBuyerLetter(p) {
  const user = process.env.MAIL_USER, pass = process.env.MAIL_PASS;
  const to = p.metadata && p.metadata.email;
  if (!user || !pass) return 'skipped:not_configured';
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return 'skipped:no_email';
  const t = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.yandex.ru', port: 465, secure: true, auth: { user, pass },
  });
  const l = buildLetter(p);
  await t.sendMail({ from: { name: 'Кристина Елизарова', address: user }, to, replyTo: user, subject: l.subject, text: l.text, html: l.html });
  return 'sent';
}

module.exports = { sendBuyerLetter, buildLetter };
