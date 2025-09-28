'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { LucideIcon, Search } from 'lucide-react';
import { quickActions } from '@/config/navigation';
import { tryGetNavigationEntry } from '@/lib/navigation/resolve-route.util';

type ResolvedAction = {
  id: string;
  title: string;
  href: string;
  category: string;
  description?: string;
  icon?: LucideIcon;
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  // Group items by category
  const resolvedActions: ResolvedAction[] = quickActions
    .map((action) => {
      const entry = tryGetNavigationEntry(action.target);

      if (!entry || entry.item.hidden || entry.item.external) {
        return null;
      }

      return {
        id: action.key,
        title: action.label,
        description: action.description,
        href: entry.path,
        icon: action.icon,
        category: action.category || 'Navigation',
      } as ResolvedAction;
    })
    .filter((action): action is ResolvedAction => Boolean(action));

  const groupedItems = resolvedActions.reduce(
    (groups, item) => {
      const category = item.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    },
    {} as Record<string, typeof resolvedActions>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search for actions and navigation..."
              value={search}
              onValueChange={setSearch}
            />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {Object.entries(groupedItems).map(([category, items]) => (
              <CommandGroup key={category} heading={category}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    onSelect={() => {
                      runCommand(() => router.push(item.href));
                    }}
                    className="flex items-center gap-3"
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
