import { generateId } from 'lucia';
import { db } from '$lib/db/connection.js';
import { users, passwordResetTokens, emailVerificationTokens } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Generate a secure random token
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Password Reset Token Functions
export async function createPasswordResetToken(userId: string): Promise<string> {
  // Delete any existing tokens for this user
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  
  await db.insert(passwordResetTokens).values({
    id: generateId(25),
    userId,
    token,
    expiresAt
  });
  
  return token;
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const result = await db
    .select({
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt
    })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);
  
  if (result.length === 0) {
    return null; // Token not found
  }
  
  const { userId, expiresAt } = result[0];
  
  if (expiresAt < new Date()) {
    // Token expired, delete it
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return null;
  }
  
  return userId;
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const userId = await verifyPasswordResetToken(token);
  
  if (userId) {
    // Delete the token after verification
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
  }
  
  return userId;
}

// Email Verification Token Functions
export async function createEmailVerificationToken(userId: string): Promise<string> {
  // Delete any existing tokens for this user
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
  
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  await db.insert(emailVerificationTokens).values({
    id: generateId(25),
    userId,
    token,
    expiresAt
  });
  
  return token;
}

export async function verifyEmailVerificationToken(token: string): Promise<string | null> {
  const result = await db
    .select({
      userId: emailVerificationTokens.userId,
      expiresAt: emailVerificationTokens.expiresAt
    })
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token))
    .limit(1);
  
  if (result.length === 0) {
    return null; // Token not found
  }
  
  const { userId, expiresAt } = result[0];
  
  if (expiresAt < new Date()) {
    // Token expired, delete it
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
    return null;
  }
  
  return userId;
}

export async function consumeEmailVerificationToken(token: string): Promise<string | null> {
  const userId = await verifyEmailVerificationToken(token);
  
  if (userId) {
    // Delete the token after verification
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
    
    // Mark email as verified
    await db
      .update(users)
      .set({ 
        emailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
  
  return userId;
}

// Cleanup expired tokens (should be called periodically)
export async function cleanupExpiredTokens(): Promise<void> {
  const now = new Date();
  
  await Promise.all([
    db.delete(passwordResetTokens).where(eq(passwordResetTokens.expiresAt, now)),
    db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.expiresAt, now))
  ]);
  
  console.log('✅ Expired tokens cleaned up');
} 