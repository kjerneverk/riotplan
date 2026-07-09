import type { IUserRepository } from './repositories/user-repository.js';
import type { ITokenRepository } from './repositories/token-repository.js';
import type { IPlanRepository } from './repositories/plan-repository.js';
import type { UserPreferences } from './types/user.js';

export interface IDbFactory {
  users: IUserRepository;
  tokens: ITokenRepository;
  plans: IPlanRepository;
  // Future:
  // notes: INoteRepository;
}

export type { UserPreferences };
