'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2 } from 'lucide-react';
import { signIn, signUp, forgotPassword } from './actions';
import { ActionState } from '@/lib/auth/middleware';
import { authClient } from '@/lib/auth/auth-client';
import { APP_BASE_PATH } from '@/config/navigation';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordState, forgotPasswordFormAction, forgotPasswordPending] =
    useActionState<ActionState, FormData>(forgotPassword, {
      error: '',
      success: '',
    });

  const resolvedCallbackURL = redirect?.length ? redirect : APP_BASE_PATH;

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: resolvedCallbackURL,
    });
  };

  const handleFacebookSignIn = async () => {
    await authClient.signIn.social({
      provider: 'facebook',
      callbackURL: resolvedCallbackURL,
    });
  };

  const handleLinkedInSignIn = async () => {
    await authClient.signIn.social({
      provider: 'linkedin',
      callbackURL: resolvedCallbackURL,
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          {mode === 'signin'
            ? 'Sign in to your account'
            : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {!showForgotPassword ? (
          <form className="space-y-6" action={formAction}>
            <input type="hidden" name="redirect" value={redirect || ''} />
            <input type="hidden" name="priceId" value={priceId || ''} />
            <input type="hidden" name="inviteId" value={inviteId || ''} />
            <div>
              <Label
                htmlFor="email"
                className="block text-sm font-medium text-muted-foreground"
              >
                Email
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={state.email}
                  required
                  maxLength={50}
                  className="rounded-full py-2"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="password"
                className="block text-sm font-medium text-muted-foreground"
              >
                Password
              </Label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                  defaultValue={state.password}
                  required
                  minLength={8}
                  maxLength={100}
                  className="rounded-full py-2"
                  placeholder="Enter your password"
                />
              </div>
              {mode === 'signin' && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {state?.error && (
              <div className="text-destructive text-sm">{state.error}</div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full rounded-full shadow-sm"
                size="lg"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Loading...
                  </>
                ) : mode === 'signin' ? (
                  'Sign in'
                ) : (
                  'Sign up'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form className="space-y-6" action={forgotPasswordFormAction}>
            <div>
              <Label
                htmlFor="forgot-email"
                className="block text-sm font-medium text-muted-foreground"
              >
                Email
              </Label>
              <div className="mt-1">
                <Input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={50}
                  className="rounded-full py-2"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {forgotPasswordState?.error && (
              <div className="text-destructive text-sm">
                {forgotPasswordState.error}
              </div>
            )}

            {forgotPasswordState?.success && (
              <div className="text-green-600 text-sm">
                {forgotPasswordState.success}
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1 rounded-full"
              >
                Back to Sign In
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-full shadow-sm"
                size="lg"
                disabled={forgotPasswordPending}
              >
                {forgotPasswordPending ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-muted text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              variant="outline"
              size="lg"
              className="w-full justify-center rounded-full shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              onClick={handleFacebookSignIn}
              size="lg"
              className="w-full flex justify-center items-center rounded-full shadow-sm text-sm font-medium text-white bg-[#1877F2] hover:bg-[#166FE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Continue with Facebook
            </Button>

            <Button
              type="button"
              onClick={handleLinkedInSignIn}
              size="lg"
              className="w-full flex justify-center items-center rounded-full shadow-sm text-sm font-medium text-white bg-[#0077B5] hover:bg-[#005885] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Continue with LinkedIn
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-muted text-muted-foreground">
                {mode === 'signin'
                  ? 'New to our platform?'
                  : 'Already have an account?'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                redirect ? `?redirect=${redirect}` : ''
              }${priceId ? `&priceId=${priceId}` : ''}`}
              className="w-full flex justify-center py-2 px-4 border border-border rounded-full shadow-sm text-sm font-medium text-muted-foreground bg-card hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {mode === 'signin'
                ? 'Create an account'
                : 'Sign in to existing account'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
