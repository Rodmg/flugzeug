import * as TokenGenerator from 'token-generator';

export class TokenG  {
  user: any;
  password: any;
  constructor(uSecret: string, uMap: string, pSecret: string, pMap: string) {
    this.user = TokenGenerator({
        salt: uSecret,
        timestampMap: uMap, // 10 chars array for obfuscation proposes 
    });

    this.password = TokenGenerator({
        salt: pSecret,
        timestampMap: pMap, // 10 chars array for obfuscation proposes 
    });
  }

  getUser(): string {
    return this.user.generate();
  }

  getPassword(): string {
    return this.password.generate();
  }

  verifyUser(token: string): boolean {
    return this.user.isValid(token);
  }

  verifyPassword(token: string): boolean {
    return this.password.isValid(token);
  }
}
