import { Markup } from 'telegraf';

export function actionButtonsForGuest() {
  return Markup.keyboard([['🔐 Войти', '🆕 Регистрация']]).resize();
}

export function actionButtonsForUser() {
  return Markup.keyboard([
    ['📋 Список проектов'],
    ['👋 Выйти из аккаунта'],
  ]).resize();
}
