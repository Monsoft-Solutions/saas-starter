import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

let currentHeaders: Headers = new Headers();
const headersMock = vi.fn(async () => currentHeaders);

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

const getSession = vi.fn();
const getActiveMember = vi.fn();
const listOrganizations = vi.fn();
const setActiveOrganization = vi.fn();
const getFullOrganization = vi.fn();

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession,
      getActiveMember,
      listOrganizations,
      setActiveOrganization,
      getFullOrganization,
    },
  },
}));

const selectMock = vi.fn();

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: selectMock,
  },
}));

function createSelectChain<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(rows),
      }),
    }),
  };
}

function mockSubscriptionRows<T>(rows: T[]) {
  selectMock.mockImplementation(() => createSelectChain(rows));
}

beforeEach(() => {
  currentHeaders = new Headers();
  vi.clearAllMocks();
  mockSubscriptionRows([]);
});

describe('server-context caching', () => {
  it('reuses the BetterAuth session for the same request headers', async () => {
    const sessionPayload = {
      user: { id: 'user_1', image: undefined, email: 'user@example.com' },
      session: {},
    };
    getSession.mockResolvedValue(sessionPayload);

    const { getServerSession } = await import('@/lib/auth/server-context');

    const first = await getServerSession();
    const second = await getServerSession();

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(first).toBe(sessionPayload);
    expect(second).toBe(sessionPayload);
  });

  it('fetches a new session when the request headers change', async () => {
    const sessionA = {
      user: { id: 'user_a', image: undefined, email: 'a@example.com' },
      session: {},
    };
    const sessionB = {
      user: { id: 'user_b', image: undefined, email: 'b@example.com' },
      session: {},
    };

    getSession.mockResolvedValueOnce(sessionA).mockResolvedValueOnce(sessionB);

    const { getServerSession } = await import('@/lib/auth/server-context');

    currentHeaders = new Headers([['x-request-id', 'first']]);
    const first = await getServerSession();

    currentHeaders = new Headers([['x-request-id', 'second']]);
    const second = await getServerSession();

    expect(getSession).toHaveBeenCalledTimes(2);
    expect(first).toBe(sessionA);
    expect(second).toBe(sessionB);
  });
});

describe('organization resolution', () => {
  it('returns the enriched organization with subscription metadata', async () => {
    const sessionPayload = {
      user: { id: 'user_1', image: 'avatar.png', email: 'user@example.com' },
      session: { activeOrganizationId: 'org_1' },
    };

    getSession.mockResolvedValue(sessionPayload);
    getActiveMember.mockResolvedValue(null);
    listOrganizations.mockResolvedValue([{ id: 'org_1' }]);
    setActiveOrganization.mockResolvedValue(undefined);

    const organizationPayload = {
      id: 'org_1',
      name: 'Demo Org',
      members: [],
      createdAt: new Date().toISOString(),
    };

    getFullOrganization.mockResolvedValue(organizationPayload);

    mockSubscriptionRows([
      {
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_456',
        stripeProductId: 'prod_789',
        planName: 'Pro',
        subscriptionStatus: 'active',
      },
    ]);

    const { getActiveOrganization } = await import(
      '@/lib/db/queries/organization.query'
    );

    const organization = await getActiveOrganization();

    expect(organization).toMatchObject({
      ...organizationPayload,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_456',
      stripeProductId: 'prod_789',
      planName: 'Pro',
      subscriptionStatus: 'active',
    });

    const fullOrganizationCall = getFullOrganization.mock.calls.at(-1)?.[0];
    expect(fullOrganizationCall?.query).toEqual({ organizationId: 'org_1' });
    expect(fullOrganizationCall?.headers).toBeInstanceOf(Headers);
  });
});
