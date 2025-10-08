import {
  listAllOrganizationsAction,
  getOrganizationStatisticsAction,
} from '@/lib/actions/admin/list-organizations.action';
import { OrganizationTable } from '@/components/admin/organizations/organization-table.component';
import { Building2, Users, CreditCard, TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { requireAdminContext } from '@/lib/auth/admin-context';
import { adminOrganizationListRequestSchema } from '@/lib/types/admin/admin-organization-list-request.schema';

/**
 * Admin organizations management page.
 * List and manage all organizations in the system.
 */
export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    subscriptionStatus?: string;
    hasSubscription?: string;
    limit?: string;
    offset?: string;
  }>;
}) {
  await requireAdminContext();

  const params = await searchParams;

  // Parse and validate search parameters using schema
  const filters = adminOrganizationListRequestSchema.parse({
    search: params.search,
    subscriptionStatus: params.subscriptionStatus,
    hasSubscription: params.hasSubscription,
    limit: params.limit,
    offset: params.offset,
    analytics: undefined, // Not used on this page
  });

  // Fetch organizations and statistics
  const [organizationsData, statistics] = await Promise.all([
    listAllOrganizationsAction(filters),
    getOrganizationStatisticsAction(),
  ]);

  // Convert to the format expected by the generic table (TableDataResponse)
  const initialData = {
    data: organizationsData.data,
    total: organizationsData.total,
    limit: organizationsData.limit,
    offset: organizationsData.offset,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground">
          Manage all organizations in the system
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalOrganizations.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Subscriptions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.withActiveSubscriptions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (statistics.withActiveSubscriptions /
                  statistics.totalOrganizations) *
                100
              ).toFixed(1)}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Trial Organizations
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.withTrialSubscriptions.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              No Subscription
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.withoutSubscriptions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (statistics.withoutSubscriptions /
                  statistics.totalOrganizations) *
                100
              ).toFixed(1)}
              % of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            View and manage all organizations in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationTable
            initialData={initialData}
            initialFilters={filters}
          />
        </CardContent>
      </Card>
    </div>
  );
}
