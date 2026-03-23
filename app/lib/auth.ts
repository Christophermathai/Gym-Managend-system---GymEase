import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECURE_JWT_SECRET = process.env.JWT_SECRET;

if (!SECURE_JWT_SECRET) {
  // We throw here because without a secret, JWTs are not secure and signatures cannot be verified.
  // In our Electron environment, this is set by the main process during server spawn.
  throw new Error('FATAL: JWT_SECRET environment variable is missing.');
}

const JWT_SECRET: string = SECURE_JWT_SECRET;

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(userId: string, email: string, role: string): string {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  if (
    parts[1] === 'null' ||
    parts[1] === 'undefined' ||
    parts[1] === '' ||
    parts[1] === 'http-only-cookie-active'
  ) {
    return null;
  }
  return parts[1];
}
