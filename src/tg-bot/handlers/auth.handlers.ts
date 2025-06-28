import { Context } from 'telegraf';
import { loginSessions, userTokens, userUUIDMap } from '../tg-state';
import { actionButtonsForGuest } from '../tg-bot.buttons';

export async function handleLogin(ctx: Context) {
  const userId = ctx.from.id;
  loginSessions.set(userId, { mode: 'login', step: 'username' });
  await ctx.reply('Введите имя пользователя для входа:');
}

export async function handleRegister(ctx: Context) {
  const userId = ctx.from.id;
  loginSessions.set(userId, { mode: 'register', step: 'username' });
  await ctx.reply('Введите имя пользователя для регистрации:');
}

export async function handleLogout(ctx: Context) {
  const userId = ctx.from.id;
  userTokens.delete(userId);
  userUUIDMap.delete(userId);
  loginSessions.delete(userId);
  await ctx.reply('👋 Вы успешно вышли из аккаунта.');
  await ctx.reply('Что вы хотите сделать?', actionButtonsForGuest());
}
