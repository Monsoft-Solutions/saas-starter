'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { updateAccount } from '@/app/(login)/actions';
import { User } from '@/lib/db/schemas';
import useSWR from 'swr';
import { Suspense } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: ActionState;
  nameValue?: string;
  emailValue?: string;
};

function AccountForm({
  state,
  nameValue = '',
  emailValue = '',
}: AccountFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your name"
          defaultValue={state.name || nameValue}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          defaultValue={emailValue}
          required
        />
      </div>
    </>
  );
}

function AccountFormWithData({ state }: { state: ActionState }) {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  return (
    <AccountForm
      state={state}
      nameValue={user?.name ?? ''}
      emailValue={user?.email ?? ''}
    />
  );
}

export default function GeneralPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={formAction}>
            <Suspense fallback={<AccountForm state={state} />}>
              <AccountFormWithData state={state} />
            </Suspense>
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            {state.success && (
              <Alert>
                <AlertDescription>{state.success}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
