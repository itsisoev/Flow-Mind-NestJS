export type LoginState = {
  mode: 'login' | 'register';
  step: 'username' | 'password';
  username?: string;
};

export const loginSessions = new Map<number, LoginState>();
export const userTokens = new Map<number, string>();
export const userUUIDMap = new Map<number, string>();
export const lastSelectedProjectMap = new Map<number, string>();
