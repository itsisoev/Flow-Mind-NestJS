import { Update, Start, Hears, InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { TgBotService } from './services/tg-bot.service';
import {
  handleLogin,
  handleRegister,
  handleLogout,
} from './handlers/auth.handlers';
import { showProjects, showProjectTasks } from './handlers/project.handlers';
import { loginSessions, userTokens, userUUIDMap } from './tg-state';
import { actionButtonsForUser } from './tg-bot.buttons';
import { TelegramNotifierService } from './services/telegram-notifier.service';

@Update()
export class TgBotUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly tgBotService: TgBotService,
    private readonly notifier: TelegramNotifierService,
  ) {}

  @Start()
  async startCommand(ctx: Context) {
    const userId = ctx.from.id;
    await ctx.reply('Привет! Выберите действие:', actionButtonsForUser());
  }

  @Hears('🔐 Войти')
  async onLogin(ctx: Context) {
    return handleLogin(ctx);
  }

  @Hears('🆕 Регистрация')
  async onRegister(ctx: Context) {
    return handleRegister(ctx);
  }

  @Hears('📋 Список проектов')
  async onProjects(ctx: Context) {
    return showProjects(ctx, this.tgBotService);
  }

  @Hears('👋 Выйти из аккаунта')
  async onLogout(ctx: Context) {
    return handleLogout(ctx);
  }

  @Hears(/.*/)
  async onText(ctx: Context) {
    const userId = ctx.from.id;
    const loginSession = loginSessions.get(userId);

    if (loginSession) {
      const text = 'text' in ctx.message ? ctx.message.text : undefined;
      if (!text) return;

      if (loginSession.step === 'username') {
        loginSession.username = text;
        loginSession.step = 'password';
        loginSessions.set(userId, loginSession);
        await ctx.reply('Введите пароль:');
        return;
      }

      if (loginSession.step === 'password') {
        await ctx.reply('🔒 Пароль получен: ' + '*'.repeat(text.length));
        const username = loginSession.username!;
        const password = text;

        try {
          if (loginSession.mode === 'login') {
            const user = await this.tgBotService.validateUser(
              username,
              password,
            );
            const loginResult = await this.tgBotService.login(user);

            userTokens.set(userId, loginResult.token);
            userUUIDMap.set(userId, loginResult.uuid);

            await this.tgBotService.saveTelegramChatId(
              loginResult.uuid,
              userId,
            );

            await ctx.reply(`✅ Вы вошли как ${loginResult.username}`);
          } else {
            const result = await this.tgBotService.createUser({
              username,
              password,
            });

            userTokens.set(userId, result.token);
            userUUIDMap.set(userId, result.user.uuid);

            await this.tgBotService.saveTelegramChatId(
              result.user.uuid,
              userId,
            );

            await ctx.reply(`✅ Пользователь ${username} зарегистрирован!`);
          }

          await ctx.reply('Что хотите сделать?', actionButtonsForUser());
        } catch (e: any) {
          await ctx.reply(`❌ Ошибка: ${e.message || e}`);
        } finally {
          loginSessions.delete(userId);
        }
        return;
      }
    }

    return showProjectTasks(ctx, this.tgBotService);
  }
}
