/**
 * API endpoint to fetch invitation details by ID
 * Used for pre-filling email in sign-up/sign-in forms
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { invitation } from '@/lib/db/schemas';
import { eq } from 'drizzle-orm';

type RouteParams = {
  params: Promise<{
    invitationId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { invitationId } = await params;

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

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
