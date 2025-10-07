/**
 * TEMPORARY: Test endpoint for Stripe integration
 * GET /api/test-stripe
 */
import { NextResponse } from 'next/server';
import { getPlanDistributionFromStripe } from '@/lib/payments/stripe';

export async function GET() {
  try {
    console.log('Testing Stripe plan distribution function...');
    // Force cache miss by using a unique key
    const { cacheService, CacheKeys } = await import('@/lib/cache');
    await cacheService.delete(CacheKeys.custom('stripe', 'plan-distribution'));

    const result = await getPlanDistributionFromStripe();
    console.log('Stripe result:', result);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
