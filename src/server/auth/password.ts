import 'server-only';

import bcrypt from 'bcryptjs';

// Reduced from 12 to 10 for better performance (still very secure)
// 10 rounds = ~150ms, 12 rounds = ~600ms on average
const SALT_ROUNDS = 10;

export const hashPassword = async (plain: string): Promise<string> => {
  return bcrypt.hash(plain, SALT_ROUNDS);
};

export const verifyPassword = async (plain: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plain, hash);
};
