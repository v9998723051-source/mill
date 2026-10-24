// Одноразовая помощь при настройке: показывает, кто нажал «Старт» в боте,
// чтобы узнать chat id Кристины. После настройки можно удалить.
module.exports = async (req, res) => {
  const token = process.env.TG_BOT_TOKEN;
  if (!token) return res.status(503).send('Бот ещё не подключён: добавьте TG_BOT_TOKEN в настройках Vercel.');
  try {
    const r = await fetch('https://api.telegram.org/bot' + token + '/getUpdates');
    const d = await r.json();
    const seen = {};
    (d.result || []).forEach(u => {
      const c = (u.message || u.my_chat_member || {}).chat;
      if (c) seen[c.id] = (c.first_name || c.title || '') + (c.username ? ' (@' + c.username + ')' : '');
    });
    const lines = Object.keys(seen).map(id => id + ' — ' + seen[id]);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(lines.length ? lines.join('\n') : 'Пока никто не нажал «Старт» в боте. Нажмите «Старт» и обновите страницу.');
  } catch (e) {
    return res.status(502).send('Не удалось связаться с Telegram.');
  }
};
