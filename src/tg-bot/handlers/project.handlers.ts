import { Context, Markup } from 'telegraf';
import { lastSelectedProjectMap, userTokens, userUUIDMap } from '../tg-state';
import { TgBotService } from '../services/tg-bot.service';
import { actionButtonsForUser } from '../tg-bot.buttons';

export async function showProjects(ctx: Context, tgBotService: TgBotService) {
  const userId = ctx.from.id;
  const token = userTokens.get(userId);
  if (!token) {
    await ctx.reply('⚠️ Пожалуйста, авторизуйтесь.');
    return;
  }

  const payload = tgBotService.decodeToken(token);
  const userUUID = payload.sub;
  userUUIDMap.set(userId, userUUID);

  const projects = await tgBotService.getProjects(userUUID);
  if (!projects.length) {
    await ctx.reply('У вас нет проектов.');
    return;
  }

  const buttons = projects.map((p) => [p.title]);
  await ctx.reply('Выберите проект:', Markup.keyboard(buttons).resize());
}

export async function showProjectTasks(
  ctx: Context,
  tgBotService: TgBotService,
) {
  const userId = ctx.from.id;
  const userUUID = userUUIDMap.get(userId);
  if (!('text' in ctx.message)) return;

  const text = ctx.message.text;
  const projects = await tgBotService.getProjects(userUUID);
  const selected = projects.find((p) => p.title === text);
  if (!selected) return;

  lastSelectedProjectMap.set(userId, selected.uuid);

  const tasks = await tgBotService.getTasks(selected.uuid, userUUID);
  if (!tasks.length) {
    await ctx.reply(`📂 В проекте "${selected.title}" пока нет задач.`);
  } else {
    for (const [i, t] of tasks.entries()) {
      await ctx.reply(
        `🔹 ${i + 1}.
📝 Заголовок: ${t.title}
📄 Описание: ${t.description || '—'}
📅 Срок: ${t.term || '—'}
🔥 Приоритет: ${t.priority || '—'}`,
      );
    }
  }

  await ctx.reply('Что хотите сделать дальше?', actionButtonsForUser());
}
