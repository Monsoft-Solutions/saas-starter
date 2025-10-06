/**
 * Organization table data type.
 * Represents a single organization row in the admin organizations table.
 */
export type OrganizationTableData = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  createdAt: Date;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeProductId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
  memberCount: number;
};

/**
 * Organization table filters type.
 * Defines available filter options for the admin organizations table.
 */
export type OrganizationTableFilters = {
  search?: string;
  subscriptionStatus?: string;
  hasSubscription?: boolean;
  limit?: number;
  offset?: number;
};
