/**
 * Invitation Landing Component
 *
 * Displays invitation details and provides clear paths for users to either
 * sign up (if they don't have an account) or sign in (if they do).
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleIcon, UserPlus, LogIn, Users, Mail } from 'lucide-react';

type Invitation = {
  id: string;
  email: string;
  role: string | null;
  status: string;
  organization: {
    id: string;
    name: string;
  } | null;
  inviter: {
    name: string | null;
    email: string | null;
  } | null;
  expiresAt: Date;
};

type InvitationLandingProps = {
  invitation: Invitation;
  invitationId: string;
};

export function InvitationLanding({
  invitation,
  invitationId,
}: InvitationLandingProps) {
  const { organization, inviter, role, email } = invitation;

  const signUpUrl = `/sign-up?invitationId=${invitationId}`;
  const signInUrl = `/sign-in?invitationId=${invitationId}`;

  // Handle serialized date strings from server
  const expiresAtDate =
    invitation.expiresAt instanceof Date
      ? invitation.expiresAt
      : new Date(invitation.expiresAt);
  const isExpired = expiresAtDate < new Date();

  if (isExpired) {
    return (
      <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <CircleIcon className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Invitation Expired
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            This invitation has expired. Please contact{' '}
            {inviter?.name || 'the team admin'} for a new invitation.
          </p>
          <div className="mt-6">
            <Link
              href="/sign-in"
              className="w-full flex justify-center py-2 px-4 border border-border rounded-full shadow-sm text-sm font-medium text-muted-foreground bg-card hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          You're Invited!
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Join {organization?.name || 'the team'} and start collaborating with
          your team.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Users className="h-5 w-5" />
              {organization?.name || 'Team'}
            </CardTitle>
            <CardDescription>
              You've been invited by {inviter?.name || 'a team member'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Invited email:
                </span>
              </div>
              <span className="text-sm font-medium">{email}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role:</span>
              <Badge variant="secondary" className="capitalize">
                {role || 'member'}
              </Badge>
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Choose how you'd like to join:
              </p>

              <div className="space-y-3">
                <Link href={signUpUrl} className="block">
                  <Button
                    className="w-full justify-center rounded-full shadow-sm"
                    size="lg"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account & Join
                  </Button>
                </Link>

                <Link href={signInUrl} className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-center rounded-full shadow-sm"
                    size="lg"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In & Join
                  </Button>
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Already have an account? Use the "Sign In & Join" option above.
                <br />
                New to our platform? Use "Create Account & Join" to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
