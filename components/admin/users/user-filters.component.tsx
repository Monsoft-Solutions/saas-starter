'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

/**
 * User filters component.
 * Provides search and filter controls for the user table.
 */
export function UserFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [role, setRole] = useState(searchParams.get('role') || 'all');

  /**
   * Update URL search params with filter values
   */
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    if (role && role !== 'all') {
      params.set('role', role);
    } else {
      params.delete('role');
    }

    // Reset to page 1 when filtering
    params.delete('page');

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearch('');
    setRole('all');

    startTransition(() => {
      router.push('/admin/users');
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              applyFilters();
            }
          }}
          className="pl-9"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        {/* Role Filter */}
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super-admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>

        {/* Apply Button */}
        <Button onClick={applyFilters} disabled={isPending}>
          Apply
        </Button>

        {/* Clear Button */}
        {(search || (role && role !== 'all')) && (
          <Button variant="outline" onClick={clearFilters} disabled={isPending}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
