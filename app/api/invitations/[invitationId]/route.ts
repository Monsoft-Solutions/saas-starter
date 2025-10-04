/**
 * API endpoint to fetch invitation details by ID
 * Used for pre-filling email in sign-up/sign-in forms
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { invitation } from '@/lib/db/schemas';
import { eq } from 'drizzle-orm';

/**
 * Zod schema for validating route parameters
 */
const ParamsSchema = z.object({
  invitationId: z.string().min(1, 'Invalid invitation ID format'),
});

type RouteParams = {
  params: Promise<{
    invitationId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;

    // Validate route parameters with Zod
    const parsed = ParamsSchema.safeParse(resolvedParams);
    if (!parsed.success) {
      const errorMessage =
        parsed.error.errors[0]?.message ?? 'Invalid invitation ID';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { invitationId } = parsed.data;

    // Fetch invitation details
    const invitationDetails = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      })
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .limit(1);

    const invitationData = invitationDetails[0];

    if (!invitationData) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (invitationData.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Check if invitation is still pending
    if (invitationData.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation has already been processed' },
        { status: 410 }
      );
    }

    // Return only the email for security (no need to expose other details)
    return NextResponse.json({
      email: invitationData.email,
    });
  } catch (error) {
    console.error('Failed to fetch invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
