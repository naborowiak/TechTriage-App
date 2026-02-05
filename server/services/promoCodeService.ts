import { db } from '../db';
import {
  promoCodesTable,
  promoCodeRedemptionsTable,
  PromoCode,
  InsertPromoCode,
} from '../../shared/schema/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface PromoCodeValidationResult {
  valid: boolean;
  code?: PromoCode;
  error?: string;
  errorCode?: 'NOT_FOUND' | 'INACTIVE' | 'EXPIRED' | 'NOT_YET_VALID' | 'MAX_REDEMPTIONS' | 'ALREADY_USED';
}

/**
 * Validate a promo code
 */
export async function validatePromoCode(
  code: string,
  userId?: string
): Promise<PromoCodeValidationResult> {
  try {
    // Look up the promo code (case-insensitive)
    const [promoCode] = await db
      .select()
      .from(promoCodesTable)
      .where(sql`LOWER(${promoCodesTable.code}) = LOWER(${code})`)
      .limit(1);

    if (!promoCode) {
      return {
        valid: false,
        error: 'Promo code not found',
        errorCode: 'NOT_FOUND',
      };
    }

    // Check if active
    if (!promoCode.isActive) {
      return {
        valid: false,
        error: 'This promo code is no longer active',
        errorCode: 'INACTIVE',
      };
    }

    const now = new Date();

    // Check valid from date
    if (promoCode.validFrom && promoCode.validFrom > now) {
      return {
        valid: false,
        error: 'This promo code is not yet valid',
        errorCode: 'NOT_YET_VALID',
      };
    }

    // Check expiration date
    if (promoCode.validUntil && promoCode.validUntil < now) {
      return {
        valid: false,
        error: 'This promo code has expired',
        errorCode: 'EXPIRED',
      };
    }

    // Check max redemptions
    if (
      promoCode.maxRedemptions !== null &&
      promoCode.redemptionCount >= promoCode.maxRedemptions
    ) {
      return {
        valid: false,
        error: 'This promo code has reached its maximum number of uses',
        errorCode: 'MAX_REDEMPTIONS',
      };
    }

    // Check if user has already used this code
    if (userId) {
      const [existingRedemption] = await db
        .select()
        .from(promoCodeRedemptionsTable)
        .where(
          and(
            eq(promoCodeRedemptionsTable.promoCodeId, promoCode.id),
            eq(promoCodeRedemptionsTable.userId, userId)
          )
        )
        .limit(1);

      if (existingRedemption) {
        return {
          valid: false,
          error: 'You have already used this promo code',
          errorCode: 'ALREADY_USED',
        };
      }
    }

    return {
      valid: true,
      code: promoCode,
    };
  } catch (error) {
    console.error('[PROMO] Error validating promo code:', error);
    return {
      valid: false,
      error: 'Failed to validate promo code',
    };
  }
}

/**
 * Record a promo code redemption
 */
export async function recordRedemption(
  promoCodeId: string,
  userId?: string,
  checkoutSessionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Insert redemption record
    await db.insert(promoCodeRedemptionsTable).values({
      id: uuidv4(),
      promoCodeId,
      userId: userId || null,
      checkoutSessionId: checkoutSessionId || null,
    });

    // Increment redemption count
    await db
      .update(promoCodesTable)
      .set({
        redemptionCount: sql`${promoCodesTable.redemptionCount} + 1`,
      })
      .where(eq(promoCodesTable.id, promoCodeId));

    console.log(`[PROMO] Recorded redemption for promo code ${promoCodeId}`);
    return { success: true };
  } catch (error) {
    console.error('[PROMO] Error recording redemption:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Create a new promo code (admin function)
 */
export async function createPromoCode(data: {
  code: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxRedemptions?: number;
  validFrom?: Date;
  validUntil?: Date;
  stripePromoCodeId?: string;
  stripeCouponId?: string;
}): Promise<{ success: boolean; promoCode?: PromoCode; error?: string }> {
  try {
    // Check if code already exists
    const [existing] = await db
      .select()
      .from(promoCodesTable)
      .where(sql`LOWER(${promoCodesTable.code}) = LOWER(${data.code})`)
      .limit(1);

    if (existing) {
      return {
        success: false,
        error: 'A promo code with this code already exists',
      };
    }

    const [promoCode] = await db
      .insert(promoCodesTable)
      .values({
        id: uuidv4(),
        code: data.code.toUpperCase(),
        description: data.description || null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxRedemptions: data.maxRedemptions || null,
        validFrom: data.validFrom || null,
        validUntil: data.validUntil || null,
        stripePromoCodeId: data.stripePromoCodeId || null,
        stripeCouponId: data.stripeCouponId || null,
        isActive: true,
        redemptionCount: 0,
      })
      .returning();

    console.log(`[PROMO] Created promo code: ${promoCode.code}`);
    return { success: true, promoCode };
  } catch (error) {
    console.error('[PROMO] Error creating promo code:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * List all promo codes (admin function)
 */
export async function listPromoCodes(): Promise<{
  success: boolean;
  promoCodes?: PromoCode[];
  error?: string;
}> {
  try {
    const promoCodes = await db
      .select()
      .from(promoCodesTable)
      .orderBy(sql`${promoCodesTable.createdAt} DESC`);

    return { success: true, promoCodes };
  } catch (error) {
    console.error('[PROMO] Error listing promo codes:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Update a promo code (admin function)
 */
export async function updatePromoCode(
  id: string,
  data: Partial<{
    description: string;
    maxRedemptions: number | null;
    validFrom: Date | null;
    validUntil: Date | null;
    isActive: boolean;
  }>
): Promise<{ success: boolean; promoCode?: PromoCode; error?: string }> {
  try {
    const [promoCode] = await db
      .update(promoCodesTable)
      .set(data)
      .where(eq(promoCodesTable.id, id))
      .returning();

    if (!promoCode) {
      return { success: false, error: 'Promo code not found' };
    }

    console.log(`[PROMO] Updated promo code: ${promoCode.code}`);
    return { success: true, promoCode };
  } catch (error) {
    console.error('[PROMO] Error updating promo code:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get promo code by Stripe promo code ID (for webhook processing)
 */
export async function getPromoCodeByStripeId(
  stripePromoCodeId: string
): Promise<PromoCode | null> {
  try {
    const [promoCode] = await db
      .select()
      .from(promoCodesTable)
      .where(eq(promoCodesTable.stripePromoCodeId, stripePromoCodeId))
      .limit(1);

    return promoCode || null;
  } catch (error) {
    console.error('[PROMO] Error getting promo code by Stripe ID:', error);
    return null;
  }
}

/**
 * Get promo code by Stripe coupon ID (for webhook processing)
 */
export async function getPromoCodeByStripeCouponId(
  stripeCouponId: string
): Promise<PromoCode | null> {
  try {
    const [promoCode] = await db
      .select()
      .from(promoCodesTable)
      .where(eq(promoCodesTable.stripeCouponId, stripeCouponId))
      .limit(1);

    return promoCode || null;
  } catch (error) {
    console.error('[PROMO] Error getting promo code by Stripe coupon ID:', error);
    return null;
  }
}
