'use client';

import { useState, useTransition } from 'react';
import { Ban, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  banUserAction,
  unbanUserAction,
} from '@/app/actions/admin/ban-user.action';
import { toast } from 'sonner';

/**
 * User data type
 */
type User = {
  id: string;
  name: string;
  email: string;
  banned: boolean;
  banReason: string | null;
};

/**
 * Ban user dialog component.
 * Allows super-admins to ban or unban users.
 */
export function BanUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [isPending, startTransition] = useTransition();

  const isUnban = user.banned;

  /**
   * Handle ban/unban submission
   */
  const handleSubmit = () => {
    if (!isUnban && reason.length < 10) {
      toast.error('Ban reason must be at least 10 characters');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('userId', user.id);

      if (isUnban) {
        // Unban user
        const result = await unbanUserAction(formData);

        if ('error' in result) {
          toast.error(result.error);
        } else {
          toast.success('User unbanned successfully');
          onOpenChange(false);
          window.location.reload();
        }
      } else {
        // Ban user
        formData.append('reason', reason);
        if (expiresInDays) {
          formData.append('expiresInDays', expiresInDays);
        }

        const result = await banUserAction(formData);

        if ('error' in result) {
          toast.error(result.error);
        } else {
          toast.success('User banned successfully');
          onOpenChange(false);
          window.location.reload();
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUnban ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Unban User
              </>
            ) : (
              <>
                <Ban className="h-5 w-5 text-destructive" />
                Ban User
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isUnban
              ? `Remove ban from ${user.name} (${user.email})`
              : `Ban ${user.name} (${user.email}) from accessing the platform`}
          </DialogDescription>
        </DialogHeader>

        <div className="stack-md py-4">
          {isUnban ? (
            <>
              {/* Current ban information */}
              <Alert>
                <AlertDescription>
                  <div className="stack-sm">
                    <p className="font-medium">Current ban reason:</p>
                    <p className="text-sm">
                      {user.banReason || 'No reason provided'}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <p className="text-sm text-muted-foreground">
                This user will be able to access their account again after being
                unbanned.
              </p>
            </>
          ) : (
            <>
              {/* Ban reason */}
              <div className="stack-sm">
                <Label htmlFor="reason">
                  Ban Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why this user is being banned..."
                  value={reason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setReason(e.target.value)
                  }
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 characters required
                </p>
              </div>

              {/* Expiry */}
              <div className="stack-sm">
                <Label htmlFor="expires">Ban Duration (Optional)</Label>
                <Input
                  id="expires"
                  type="number"
                  placeholder="Number of days (leave empty for permanent)"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for a permanent ban
                </p>
              </div>

              {/* Warning */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Banned users will be immediately
                  logged out and unable to access their account.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant={isUnban ? 'default' : 'destructive'}
            onClick={handleSubmit}
            disabled={isPending || (!isUnban && reason.length < 10)}
          >
            {isPending
              ? isUnban
                ? 'Unbanning...'
                : 'Banning...'
              : isUnban
                ? 'Unban User'
                : 'Ban User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
