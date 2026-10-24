// Отправляет Кристине в Telegram любые заявки: брошенные (draft),
// перешедшие к оплате (checkout) и простые заявки без оплаты (request).
const { PLANS, PREPAY, planPrice, rub, tgSend } = require('./_lib');

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').trim().slice(0, max);
}

const TITLES = {
  draft: 'Не завершила заявку (контакт оставлен, кнопку не нажала)',
  checkout: 'Новая заявка — перешла к оплате, оплата ещё не подтверждена',
  request: 'Новая заявка с сайта',
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b || '{}'); } catch (e) { b = {}; } }
  if (b.website) return res.status(200).json({ ok: true }); // ловушка для спам-ботов

  const stage = TITLES[b.stage] ? b.stage : 'request';
  const name = clean(b.name, 80), contact = clean(b.contact, 80), email = clean(b.email, 120);
  const comment = clean(b.comment, 600);
  const plan = PLANS[b.plan] ? b.plan : 'undecided';
  const mode = b.mode === 'full' ? 'full' : 'prepay';
  if (contact.length < 4 && !/@/.test(email)) return res.status(400).json({ error: 'contact' });

  const sum = mode === 'full' ? planPrice(plan) : PREPAY;
  const lines = [
    TITLES[stage] + ' — ретрит «Подлинность»',
    '',
    'Имя: ' + (name || '-'),
    'Контакт: ' + (contact || '-'),
    'Почта: ' + (email || '-'),
    'Размещение: ' + PLANS[plan].label,
  ];
  if (stage !== 'draft') lines.push('Выбрала: ' + (mode === 'full' ? 'полная оплата' : 'бронь') + (sum ? ' — ' + rub(sum) : ''));
  lines.push('Комментарий: ' + (comment || '-'));
  if (stage === 'draft') lines.push('', 'Стоит написать ей первой.');

  try {
    await tgSend(lines.join('\n'));
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('lead error', e);
    return res.status(503).json({ error: String(e.message || e) });
  }
};
