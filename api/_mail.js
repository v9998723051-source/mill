// Письмо покупательнице от Кристины после успешной оплаты.
// Отправляется через почту Кристины (SMTP Яндекса). Нужны переменные в Vercel:
// MAIL_USER — адрес (perelyot1991@yandex.ru), MAIL_PASS — пароль приложения Яндекса.
// Если их нет — письмо просто не отправляется, остальное работает.
const nodemailer = require('nodemailer');
const { PLANS, planPrice, rub } = require('./_lib');

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

  const lines = [];
  lines.push(full
    ? 'Ваше участие в ретрите «Подлинность — это тотально вы» оплачено. Место за вами.'
    : 'Ваше место на ретрите «Подлинность — это тотально вы» забронировано.');
  const facts = [
    ['Даты', '4–7 февраля 2027'],
    ['Место', 'SABI Club, Валдай'],
    ['Заезд', '4 февраля в 14:00'],
    ['Отъезд', '7 февраля в 16:00, после обеда'],
    ['Размещение', plan.label],
    ['Оплачено', rub(paid)],
  ];
  if (!full) {
    facts.push(['Остаток', price && paid < price
      ? rub(price - paid) + ' — до 4 января 2027 включительно'
      : 'сумму и срок доплаты (до 4 января 2027) подскажу лично']);
  }
  const after = [
    'В ближайшее время я напишу вам лично в Telegram или по контакту, который вы оставили, — расскажу, как добраться, что взять с собой и как подготовиться.',
    'Если появятся вопросы — пишите мне в Telegram: @kristinaperelyot, или просто ответьте на это письмо.',
  ];
  const subject = (m.test === '1' ? '[ТЕСТ] ' : '') + (full
    ? 'Вы едете на ретрит «Подлинность» — оплата получена'
    : 'Ваше место на ретрите «Подлинность» забронировано');

  const text = [hello, '', lines[0], '', ...facts.map(f => f[0] + ': ' + f[1]), '', ...after, '',
    'Я очень рада, что вы с нами.', 'Кристина Елизарова',
    '', 'Чек об оплате приходит отдельно от ЮKassa. Номер платежа: ' + p.id].join('\n');

  const html = `<!doctype html><html><body style="margin:0;background:#f4efe8;font-family:Georgia,'Times New Roman',serif;color:#2b2420">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<div style="background:#fffaf4;border-radius:16px;padding:32px 28px">
<p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#9a7b62;margin:0 0 18px">Телесный ретрит · Подлинность</p>
<p style="font-size:18px;margin:0 0 14px">${esc(hello)}</p>
<p style="font-size:17px;line-height:1.55;margin:0 0 22px">${esc(lines[0])}</p>
<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:15px;margin:0 0 22px">
${facts.map(f => `<tr><td style="padding:8px 0;border-bottom:1px solid #eadfd2;color:#8a7765;width:120px;vertical-align:top">${esc(f[0])}</td><td style="padding:8px 0;border-bottom:1px solid #eadfd2">${esc(f[1])}</td></tr>`).join('')}
</table>
${after.map(a => `<p style="font-size:16px;line-height:1.55;margin:0 0 14px">${esc(a)}</p>`).join('')}
<p style="font-size:16px;line-height:1.55;margin:22px 0 4px">Я очень рада, что вы с нами.</p>
<p style="font-size:16px;margin:0">Кристина Елизарова</p>
</div>
<p style="font-family:Arial,sans-serif;font-size:12px;color:#9a8b7d;text-align:center;margin:16px 0 0">Чек об оплате приходит отдельно от ЮKassa. Номер платежа: ${esc(p.id)}</p>
</div></body></html>`;
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
