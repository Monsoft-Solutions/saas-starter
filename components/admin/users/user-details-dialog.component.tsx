'use client';

import { formatDistanceToNow, format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  XCircle,
  Mail,
  Calendar,
  Shield,
  Building2,
  Ban,
} from 'lucide-react';

/**
 * User data type
 */
type User = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  emailVerified: boolean;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
};

/**
 * User details dialog component.
 * Displays comprehensive user information.
 */
export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Complete information about this user account
          </DialogDescription>
        </DialogHeader>

        <div className="stack-md">
          {/* Basic Information */}
          <div className="stack-sm">
            <h3 className="font-semibold">Basic Information</h3>
            <div className="grid gap-4 rounded-lg border bg-muted/30 p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="col-span-2 font-medium">{user.name}</div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="col-span-2 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user.email}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-muted-foreground">Role</div>
                <div className="col-span-2">
                  <Badge
                    variant={
                      user.role === 'super-admin'
                        ? 'default'
                        : user.role === 'admin'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="capitalize"
                  >
                    {user.role === 'super-admin' && (
                      <Shield className="mr-1 h-3 w-3" />
                    )}
                    {user.role || 'user'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-muted-foreground">
                  Email Verified
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  {user.emailVerified ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Not verified
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-muted-foreground">
                  Account Created
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(user.createdAt), 'PPP')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (
                    {formatDistanceToNow(new Date(user.createdAt), {
                      addSuffix: true,
                    })}
                    )
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ban Information */}
          {user.banned && (
            <>
              <Separator />
              <div className="stack-sm">
                <h3 className="font-semibold text-destructive">
                  Ban Information
                </h3>
                <div className="grid gap-4 rounded-lg border border-destructive bg-destructive/10 p-4">
                  <div className="flex items-center gap-2">
                    <Ban className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-destructive">
                      This user is currently banned
                    </span>
                  </div>

                  {user.banReason && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-sm text-muted-foreground">
                        Reason
                      </div>
                      <div className="col-span-2 text-sm">{user.banReason}</div>
                    </div>
                  )}

                  {user.banExpires && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-sm text-muted-foreground">
                        Expires
                      </div>
                      <div className="col-span-2 text-sm">
                        {format(new Date(user.banExpires), 'PPP')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Organizations Section - Placeholder */}
          <Separator />
          <div className="stack-sm">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organizations
            </h3>
            <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              Organization membership information will be displayed here
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
