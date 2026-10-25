// Создаёт платёж в ЮKassa и возвращает ссылку на страницу оплаты.
const crypto = require('crypto');
const { PLANS, PREPAY, planPrice, ykAuth } = require('./_lib');

const SITE = process.env.SITE_URL || 'https://podlinnost-retreat.vercel.app';

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const auth = ykAuth();
  if (!auth) return res.status(503).json({ error: 'not_configured' });

  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const name = clean(b.name, 80), contact = clean(b.contact, 80), email = clean(b.email, 120);
  const plan = PLANS[b.plan] ? b.plan : 'undecided';
  const mode = b.mode === 'full' ? 'full' : 'prepay';
  const comment = clean(b.comment, 400);

  if (!name || contact.length < 4) return res.status(400).json({ error: 'fields' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'email' });
  if (mode === 'full' && !planPrice(plan)) return res.status(400).json({ error: 'plan' });

  // Тестовая оплата 100 ₽ — только по секретному коду из настроек (YK_TEST_CODE)
  const isTest = !!process.env.YK_TEST_CODE && String(b.test || '') === process.env.YK_TEST_CODE;
  const amount = isTest ? 100 : (mode === 'full' ? planPrice(plan) : PREPAY);
  const value = amount.toFixed(2);
  const what = mode === 'full'
    ? 'Оплата участия в ретрите «Подлинность», 4–7 февраля 2027'
    : 'Бронирование места на ретрите «Подлинность», 4–7 февраля 2027';

  const order = crypto.randomUUID();
  const body = {
    amount: { value, currency: 'RUB' },
    capture: true,
    confirmation: { type: 'redirect', return_url: SITE + '/?pay=return&order=' + order + '#booking' },
    description: what.slice(0, 128),
    metadata: { name, contact, email, plan, mode, comment: comment || '-', test: isTest ? '1' : '0', order },
  };

  if (process.env.YK_RECEIPT === '1') {
    body.receipt = {
      customer: { email },
      items: [{
        description: what.slice(0, 128),
        quantity: '1.00',
        amount: { value, currency: 'RUB' },
        vat_code: Number(process.env.YK_VAT_CODE || 1),
        payment_subject: 'service',
        payment_mode: mode === 'full' ? 'full_prepayment' : 'partial_prepayment',
      }],
    };
  }

  try {
    const r = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        'Idempotence-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok || !data.confirmation || !data.confirmation.confirmation_url) {
      console.error('yookassa create failed', r.status, JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: 'yookassa' });
    }
    return res.status(200).json({ id: data.id, url: data.confirmation.confirmation_url });
  } catch (e) {
    console.error('pay error', e);
    return res.status(502).json({ error: 'network' });
  }
};
