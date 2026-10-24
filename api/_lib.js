// Общие настройки и цены ретрита «Подлинность».
// Цены считаются на сервере, чтобы сумму нельзя было подменить в браузере.

const EARLY_END = new Date('2026-12-01T00:00:00+03:00').getTime();
const PREPAY = 10000;

const PLANS = {
  double: { label: 'Двухместное проживание', early: 51000, late: 55000 },
  single: { label: 'Одноместное проживание', early: 57000, late: 61000 },
  friend: { label: 'С подругой (за двоих)', early: 96000, late: 100000 },
  undecided: { label: 'Пока не решила', early: null, late: null },
};

function planPrice(plan, now = Date.now()) {
  const p = PLANS[plan];
  if (!p || p.early == null) return null;
  return now < EARLY_END ? p.early : p.late;
}

function rub(n) {
  return n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
}

function ykAuth() {
  const id = process.env.YK_SHOP_ID, key = process.env.YK_SECRET_KEY;
  if (!id || !key) return null;
  return 'Basic ' + Buffer.from(id + ':' + key).toString('base64');
}

async function ykGetPayment(id) {
  const auth = ykAuth();
  if (!auth) throw new Error('not_configured');
  const r = await fetch('https://api.yookassa.ru/v3/payments/' + encodeURIComponent(id), {
    headers: { Authorization: auth },
  });
  if (!r.ok) throw new Error('yookassa_get_' + r.status);
  return r.json();
}

async function tgSend(text) {
  const token = process.env.TG_BOT_TOKEN;
  const chats = (process.env.TG_CHAT_ID || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!token || !chats.length) throw new Error('tg_not_configured');
  for (const chat_id of chats) {
    const r = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text, disable_web_page_preview: true }),
    });
    if (!r.ok) throw new Error('tg_send_' + r.status + ' ' + (await r.text()).slice(0, 200));
  }
}

module.exports = { PLANS, PREPAY, planPrice, rub, ykAuth, ykGetPayment, tgSend };
