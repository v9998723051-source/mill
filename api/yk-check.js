// Проверка подключения ЮKassa: показывает, к какому магазину подошёл ключ.
// Ничего не оплачивает и ключ не показывает.
const { ykAuth } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const auth = ykAuth();
  if (!auth) return res.status(200).send('ЮKassa не подключена: нет YK_SHOP_ID или YK_SECRET_KEY в настройках Vercel.');
  try {
    const r = await fetch('https://api.yookassa.ru/v3/me', { headers: { Authorization: auth } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(200).send('Ключ не подошёл (ответ ЮKassa ' + r.status + '): ' + (d.description || d.code || 'ошибка') +
        '\nПроверьте, что ключ выпущен именно в магазине ' + process.env.YK_SHOP_ID + ' и вставлен целиком.');
    }
    const lines = [
      'ЮKassa подключена ✓',
      'Магазин: ' + (d.account_id || process.env.YK_SHOP_ID),
      'Статус магазина: ' + (d.status === 'enabled' ? 'работает' : (d.status || '-')),
      'Режим: ' + (d.test ? 'ТЕСТОВЫЙ (деньги не списываются)' : 'боевой — настоящие оплаты'),
      'Чеки от ЮKassa: ' + (d.fiscalization_enabled || (d.fiscalization && d.fiscalization.enabled) ? 'включены' : 'не видно в настройках'),
    ];
    return res.status(200).send(lines.join('\n'));
  } catch (e) {
    return res.status(200).send('Не удалось связаться с ЮKassa: ' + String(e.message || e));
  }
};
