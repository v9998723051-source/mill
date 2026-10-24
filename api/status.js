// Возвращает только статус платежа — для страницы «Спасибо» после возврата из ЮKassa.
const { ykGetPayment } = require('./_lib');

module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || '');
  if (!/^[0-9a-f-]{20,60}$/i.test(id)) return res.status(400).json({ error: 'id' });
  try {
    const p = await ykGetPayment(id);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ status: p.status, paid: !!p.paid, amount: p.amount && p.amount.value });
  } catch (e) {
    return res.status(502).json({ error: 'unavailable' });
  }
};
