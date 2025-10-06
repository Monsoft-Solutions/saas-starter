import { describe, expect, it } from 'vitest';
import {
  getRolePermissions,
  hasAnyPermission,
  hasPermission,
  isKnownPermission,
} from '@/lib/auth/permissions';
import { ROLE_PERMISSIONS } from '@/lib/types/admin/role-permission.map';

describe('admin permission helpers', () => {
  it('returns cached read-only set for known roles', () => {
    const firstCall = getRolePermissions('admin');
    const secondCall = getRolePermissions('admin');

    expect(firstCall).toBe(secondCall);
    expect(firstCall).toEqual(new Set(ROLE_PERMISSIONS.admin));
  });

  it('returns full permission set for super-admin role', () => {
    const permissions = getRolePermissions('super-admin');

    expect(permissions).toEqual(new Set(ROLE_PERMISSIONS['super-admin']));
    expect(hasPermission(permissions, 'users:write')).toBe(true);
    expect(hasPermission(permissions, 'analytics:write')).toBe(true);
  });

  it('returns an empty set for unknown or missing roles', () => {
    const missingRole = getRolePermissions(null);
    const unknownRole = getRolePermissions('unrecognized');

    expect(missingRole).toBe(unknownRole);
    expect(missingRole.size).toBe(0);
  });

  it('evaluates individual permission membership for arrays and sets', () => {
    const adminSet = getRolePermissions('admin');

    expect(hasPermission(adminSet, 'users:read')).toBe(true);
    expect(hasPermission(adminSet, 'users:write')).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.admin, 'analytics:read')).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.admin, 'analytics:write')).toBe(
      false
    );
  });

  it('detects any matching permission from the required collection', () => {
    const adminSet = getRolePermissions('admin');

    expect(
      hasAnyPermission(adminSet, ['users:write', 'organizations:read'])
    ).toBe(true);
    expect(hasAnyPermission(adminSet, ['users:write', 'analytics:write'])).toBe(
      false
    );
  });

  it('tracks the canonical permission catalog', () => {
    expect(isKnownPermission('users:read')).toBe(true);
    expect(isKnownPermission('non-existent:permission')).toBe(false);
  });
});
