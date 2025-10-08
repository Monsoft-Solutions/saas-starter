/**
 * React hook glue that surfaces an organization's subscription status via the shared API client.
 */
import { useApiQuery } from '../use-api.hook';
import { apiRoutes } from '@/lib/api/routes.config';

/**
 * Custom hook to fetch organization subscription status via the standardized API client.
 */
export function useOrganizationSubscription() {
  const { data, error, isLoading, mutate } = useApiQuery(
    apiRoutes.organization.subscription
  );

  return {
    subscription: data,
    isLoading,
    error,
    mutate,
  };
}
