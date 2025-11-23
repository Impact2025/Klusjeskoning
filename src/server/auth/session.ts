import 'server-only';

import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { addMilliseconds, isBefore } from 'date-fns';
import { eq } from 'drizzle-orm';

import { db } from '../db/client';
import { sessions } from '../db/schema';

const SESSION_COOKIE = 'kk_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export const createSession = async (familyId: string) => {
  const token = randomUUID();
  const expiresAt = addMilliseconds(new Date(), SESSION_TTL_MS);

  await db.insert(sessions).values({
    familyId,
    token,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return { token, expiresAt };
};

export const clearSession = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (sessionCookie) {
    await db.delete(sessions).where(eq(sessions.token, sessionCookie.value));
    cookieStore.set(SESSION_COOKIE, '', { expires: new Date(0), path: '/' });
  }
};

export const getSession = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie) {
    return null;
  }

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.token, sessionCookie.value),
    with: {
      family: true,
    },
  });

  if (!session) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  if (isBefore(session.expiresAt, new Date())) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    cookieStore.set(SESSION_COOKIE, '', { expires: new Date(0), path: '/' });
    return null;
  }

  return session;
};

export const requireSession = async () => {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthenticated');
  }
  return session;
};
