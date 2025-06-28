import { forwardRef, Module, Provider } from '@nestjs/common';
import { TgBotService } from './services/tg-bot.service';
import { TgBotUpdate } from './tg-bot.update';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProjectsModule } from '../projects/projects.module';
import { TelegramNotifierService } from './services/telegram-notifier.service';
import { Telegraf } from 'telegraf';

export const TelegrafProvider: Provider = {
  provide: Telegraf,
  useFactory: () => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined');
    }
    return new Telegraf(botToken);
  },
};

@Module({
  imports: [
    AuthModule,
    UsersModule,
    forwardRef(() => ProjectsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    TelegrafProvider,
    TgBotService,
    JwtStrategy,
    TgBotUpdate,
    TelegramNotifierService,
  ],
  exports: [TelegramNotifierService],
})
export class TgBotModule {}
