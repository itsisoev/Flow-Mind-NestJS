import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramNotifierService {
  constructor(private readonly bot: Telegraf) {}

  async notifyUser(userTelegramId: number, message: string) {
    try {
      await this.bot.telegram.sendMessage(userTelegramId, message);
    } catch (error) {
      console.error(`❌ Ошибка отправки в Telegram:`, error);
    }
  }
}
