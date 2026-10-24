// Помощь при настройке Telegram: показывает, к какому боту подключён ключ,
// и кто нажал «Старт». Каждому, кто написал боту, бот отвечает подтверждением.
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const token = process.env.TG_BOT_TOKEN;
  if (!token) return res.status(200).send('Ключ бота не найден в настройках Vercel (TG_BOT_TOKEN).');
  const api = (m, body) => fetch('https://api.telegram.org/bot' + token + '/' + m, body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : undefined).then(r => r.json());
  try {
    const me = await api('getMe');
    if (!me.ok) return res.status(200).send('Ключ не подходит: Telegram ответил «' + (me.description || 'ошибка') + '». Проверьте, что в TG_BOT_TOKEN вставлен ключ от @podlinnost_retreat_bot целиком.');
    const out = ['Ключ подключён к боту: @' + me.result.username, ''];
    const hook = await api('getWebhookInfo');
    if (hook.ok && hook.result && hook.result.url) {
      out.push('У этого бота включён вебхук на другой сервис:', hook.result.url, 'Похоже, это ключ от другого бота (например, автоворонки). Нужен ключ от @podlinnost_retreat_bot.');
      return res.status(200).send(out.join('\n'));
    }
    const d = await api('getUpdates');
    if (!d.ok) { out.push('Telegram: ' + (d.description || 'ошибка')); return res.status(200).send(out.join('\n')); }
    const seen = {};
    (d.result || []).forEach(u => {
      const c = (u.message || u.my_chat_member || {}).chat;
      if (c && c.type === 'private') seen[c.id] = (c.first_name || '') + (c.last_name ? ' ' + c.last_name : '') + (c.username ? ' (@' + c.username + ')' : '');
    });
    const ids = Object.keys(seen);
    if (!ids.length) {
      out.push('Пока никто не написал боту.', 'Откройте t.me/' + me.result.username + ', нажмите «Старт», отправьте «привет» и обновите эту страницу.');
    } else {
      out.push('Написали боту:');
      ids.forEach(id => out.push(id + ' — ' + seen[id]));
      for (const id of ids) {
        try { await api('sendMessage', { chat_id: id, text: 'Бот на связи. Как только настройка закончится, сюда будут приходить заявки на ретрит «Подлинность».' }); } catch (e) {}
      }
    }
    return res.status(200).send(out.join('\n'));
  } catch (e) {
    return res.status(200).send('Не удалось связаться с Telegram: ' + String(e.message || e));
  }
};
