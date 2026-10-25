// Приёмник уведомлений ЮKassa. Статус платежа всегда перепроверяется прямым
// запросом к ЮKassa, поэтому подделать «оплату» запросом на этот адрес нельзя.
const { PLANS, rub, ykGetPayment, tgSend } = require('./_lib');

const CANCEL_REASONS = {
  expired_on_confirmation: 'не оплатила вовремя (ушла со страницы оплаты)',
  insufficient_funds: 'недостаточно средств на карте',
  card_expired: 'истёк срок действия карты',
  canceled_by_merchant: 'отменено магазином',
  '3d_secure_failed': 'не прошла подтверждение 3-D Secure',
  payment_method_restricted: 'способ оплаты недоступен',
  fraud_suspected: 'банк заподозрил мошенничество',
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b || '{}'); } catch (e) { b = {}; } }
  const id = b && b.object && b.object.id;
  if (!id || !/^payment\.(succeeded|canceled)$/.test(b.event || '')) return res.status(200).json({ ok: true, skipped: true });

  try {
    const p = await ykGetPayment(id);
    const m = p.metadata || {};
    const amount = rub(Number(p.amount && p.amount.value) || 0);
    const plan = (PLANS[m.plan] || PLANS.undecided).label;
    let title;
    if (p.status === 'succeeded' && p.paid) {
      title = (m.test === '1' ? 'ТЕСТ (не настоящая бронь): ' : '') + (m.mode === 'full' ? 'ОПЛАЧЕНО участие' : 'ОПЛАЧЕНА бронь') + ' — ретрит «Подлинность»';
    } else if (p.status === 'canceled') {
      const r = p.cancellation_details && p.cancellation_details.reason;
      title = (m.test === '1' ? 'ТЕСТ: ' : '') + 'Оплата НЕ прошла — ' + (CANCEL_REASONS[r] || r || 'платёж отменён') + '. Стоит написать ей.';
    } else {
      return res.status(200).json({ ok: true, status: p.status });
    }
    const text = [
      title,
      '',
      'Сумма: ' + amount,
      'Имя: ' + (m.name || '-'),
      'Контакт: ' + (m.contact || '-'),
      'Почта: ' + (m.email || '-'),
      'Размещение: ' + plan,
      'Комментарий: ' + (m.comment || '-'),
      '',
      'Платёж ЮKassa: ' + p.id,
    ].join('\n');
    await tgSend(text);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('webhook error', e);
    return res.status(500).json({ error: String(e.message || e) }); // ЮKassa повторит позже
  }
};
