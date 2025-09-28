/**
 * React hook glue that surfaces an organization's subscription status via the shared API client.
 */
import useSWR from 'swr';
import { createApiFetcher, type ApiClientError } from '@/lib/api/client';
import type { OrganizationSubscriptionResponse } from '@/lib/types/api/subscription.type';

// Shared SWR fetcher that understands the standardized `ApiResponse<T>` envelope.
const fetchOrganizationSubscription =
  createApiFetcher<OrganizationSubscriptionResponse>();

/**
 * Custom hook to fetch organization subscription status via the standardized API client.
 */
export function useOrganizationSubscription() {
  const { data, error, isLoading, mutate } = useSWR<
    OrganizationSubscriptionResponse | undefined,
    ApiClientError
  >('/api/organization/subscription', fetchOrganizationSubscription, {
    revalidateOnFocus: true,
    refreshInterval: 30000,
    errorRetryCount: 2,
    errorRetryInterval: 5000,
  });

  return {
    subscription: data,
    isLoading,
    error,
    mutate,
  };
}
