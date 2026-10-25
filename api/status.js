// Статус платежа для страницы «Спасибо» после возврата из ЮKassa.
// Принимает номер заказа из ссылки возврата (order) или id платежа.
const { ykGetPayment, ykFindByOrder } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const id = String((req.query && req.query.id) || '');
  const order = String((req.query && req.query.order) || '');
  try {
    let p = null;
    if (/^[0-9a-f-]{30,40}$/i.test(order)) p = await ykFindByOrder(order);
    else if (/^[0-9a-f-]{20,60}$/i.test(id)) p = await ykGetPayment(id);
    else return res.status(400).json({ error: 'id' });
    if (!p) return res.status(200).json({ status: 'not_found' });
    return res.status(200).json({ status: p.status, paid: !!p.paid, amount: p.amount && p.amount.value });
  } catch (e) {
    return res.status(502).json({ error: 'unavailable' });
  }
};
