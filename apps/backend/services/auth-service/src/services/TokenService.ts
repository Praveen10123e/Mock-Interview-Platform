import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { IJwtPayload } from '@nm/types';
import { BaseService } from '@nm/api-base';

export class TokenService extends BaseService {
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly accessTokenExpiresIn = '15m'; // 15 minutes
  private readonly refreshTokenExpiresIn = '7d'; // 7 days

  constructor() {
    super('TokenService');
    const keysDir = path.resolve(__dirname, '../../../../../../keys');

    // In production, these would be loaded via EnvLoader / secure secrets manager.
    // For this monorepo, we read from the generated local keys directory.
    this.privateKey = fs.readFileSync(path.join(keysDir, 'private.pem'), 'utf8');
    this.publicKey = fs.readFileSync(path.join(keysDir, 'public.pem'), 'utf8');
  }

  public generateAccessToken(payload: IJwtPayload): string {
    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  public generateRefreshToken(): string {
    // Refresh tokens are opaque secure random strings for rotation
    const crypto = require('crypto');
    return crypto.randomBytes(40).toString('hex');
  }

  public verifyAccessToken(token: string): IJwtPayload {
    return jwt.verify(token, this.publicKey, { algorithms: ['RS256'] }) as IJwtPayload;
  }
}
