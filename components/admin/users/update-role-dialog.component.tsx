'use client';

import { useState, useTransition } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updateUserRoleAction } from '@/lib/actions/admin/update-user-role.action';
import { toast } from 'sonner';

/**
 * User data type
 */
type User = {
  id: string;
  name: string;
  email: string;
  role: string | null;
};

/**
 * Update role dialog component.
 * Allows super-admins to change user roles.
 */
export function UpdateRoleDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedRole, setSelectedRole] = useState(user.role || 'user');
  const [isPending, startTransition] = useTransition();

  /**
   * Handle role update submission
   */
  const handleSubmit = () => {
    if (selectedRole === user.role) {
      toast.info('Role is already set to this value');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('role', selectedRole);

      const result = await updateUserRoleAction(formData);

      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('User role updated successfully');
        onOpenChange(false);
        // Refresh the page to show updated data
        window.location.reload();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Update User Role
          </DialogTitle>
          <DialogDescription>
            Change the role for {user.name} ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="stack-md py-4">
          {/* Role Selection */}
          <div className="stack-sm">
            <Label htmlFor="role">New Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super-admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warning for Super Admin */}
          {selectedRole === 'super-admin' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Super admin role grants full access to
                all system features and data. Only assign this role to trusted
                users.
              </AlertDescription>
            </Alert>
          )}

          {/* Info for Admin */}
          {selectedRole === 'admin' && (
            <Alert>
              <AlertDescription>
                Admin role grants access to the admin panel with management
                capabilities.
              </AlertDescription>
            </Alert>
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
            onClick={handleSubmit}
            disabled={isPending || selectedRole === user.role}
          >
            {isPending ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
