import { dbTest } from '../test-setup';
import { user, organization, member, invitation } from '@/lib/db/schemas';
import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';

describe('Organization Tests', () => {
  it('should insert a user and an organization with an owner', async () => {
    const testUser = {
      id: 'user_1',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
    };
    await dbTest.insert(user).values(testUser);

    const testOrg = {
      id: 'org_1',
      name: 'Test Organization',
      createdAt: new Date(),
    };
    await dbTest.insert(organization).values(testOrg);

    const testMember = {
      id: 'member_1',
      organizationId: testOrg.id,
      userId: testUser.id,
      role: 'owner',
      createdAt: new Date(),
    };
    await dbTest.insert(member).values(testMember);

    const users = await dbTest.select().from(user);
    const orgs = await dbTest.select().from(organization);
    const members = await dbTest.select().from(member);

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Test User');
    expect(orgs).toHaveLength(1);
    expect(orgs[0].name).toBe('Test Organization');
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('owner');
    expect(members[0].userId).toBe(testUser.id);
    expect(members[0].organizationId).toBe(testOrg.id);
  });

  it('should allow an owner to invite a user to an organization', async () => {
    const inviter = {
      id: 'user_2',
      name: 'Inviter User',
      email: 'inviter@example.com',
      emailVerified: true,
    };
    await dbTest.insert(user).values(inviter);

    const org = {
      id: 'org_2',
      name: 'Invitation Test Org',
      createdAt: new Date(),
    };
    await dbTest.insert(organization).values(org);

    await dbTest.insert(member).values({
      id: 'member_2',
      organizationId: org.id,
      userId: inviter.id,
      role: 'owner',
      createdAt: new Date(),
    });

    const invitationDetails = {
      id: 'inv_1',
      organizationId: org.id,
      inviterId: inviter.id,
      email: 'invited@example.com',
      role: 'member',
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    };
    await dbTest.insert(invitation).values(invitationDetails);

    const invitations = await dbTest.select().from(invitation);

    expect(invitations).toHaveLength(1);
    expect(invitations[0].email).toBe('invited@example.com');
    expect(invitations[0].organizationId).toBe(org.id);
    expect(invitations[0].inviterId).toBe(inviter.id);
    expect(invitations[0].status).toBe('pending');
  });

  it('should allow a user to accept an invitation and become a member', async () => {
    // 1. Setup inviter and organization
    const inviter = {
      id: 'user_3',
      name: 'Accept Test Inviter',
      email: 'accept-inviter@example.com',
      emailVerified: true,
    };
    await dbTest.insert(user).values(inviter);

    const org = {
      id: 'org_3',
      name: 'Accept Test Org',
      createdAt: new Date(),
    };
    await dbTest.insert(organization).values(org);

    await dbTest.insert(member).values({
      id: 'member_3',
      organizationId: org.id,
      userId: inviter.id,
      role: 'owner',
      createdAt: new Date(),
    });

    // 2. Create invitation
    const invitationDetails = {
      id: 'inv_2',
      organizationId: org.id,
      inviterId: inviter.id,
      email: 'invitee@example.com',
      role: 'member',
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    await dbTest.insert(invitation).values(invitationDetails);

    // 3. New user signs up
    const invitee = {
      id: 'user_4',
      name: 'Invitee User',
      email: 'invitee@example.com',
      emailVerified: true,
    };
    await dbTest.insert(user).values(invitee);

    // 4. User accepts invitation - simulate backend logic
    // Update invitation status
    await dbTest
      .update(invitation)
      .set({ status: 'accepted' })
      .where(eq(invitation.id, invitationDetails.id));

    // Add user to members
    await dbTest.insert(member).values({
      id: 'member_4',
      organizationId: org.id,
      userId: invitee.id,
      role: 'member',
      createdAt: new Date(),
    });

    // 5. Assertions
    const updatedInvitation = await dbTest
      .select()
      .from(invitation)
      .where(eq(invitation.id, invitationDetails.id));

    const newMember = await dbTest
      .select()
      .from(member)
      .where(eq(member.userId, invitee.id));

    expect(updatedInvitation[0].status).toBe('accepted');
    expect(newMember).toHaveLength(1);
    expect(newMember[0].organizationId).toBe(org.id);
    expect(newMember[0].userId).toBe(invitee.id);
    expect(newMember[0].role).toBe('member');
  });

  it('should assign correct roles to new members', async () => {
    // 1. Setup owner and organization
    const owner = {
      id: 'user_5',
      name: 'Roles Test Owner',
      email: 'roles-owner@example.com',
      emailVerified: true,
    };
    await dbTest.insert(user).values(owner);

    const org = {
      id: 'org_4',
      name: 'Roles Test Org',
      createdAt: new Date(),
    };
    await dbTest.insert(organization).values(org);

    await dbTest.insert(member).values({
      id: 'member_5',
      organizationId: org.id,
      userId: owner.id,
      role: 'owner',
      createdAt: new Date(),
    });

    // 2. Invite a member and an admin
    const memberInvitation = {
      id: 'inv_3',
      organizationId: org.id,
      inviterId: owner.id,
      email: 'new-member@example.com',
      role: 'member',
      status: 'accepted',
      expiresAt: new Date(),
    };
    const adminInvitation = {
      id: 'inv_4',
      organizationId: org.id,
      inviterId: owner.id,
      email: 'new-admin@example.com',
      role: 'admin',
      status: 'accepted',
      expiresAt: new Date(),
    };
    await dbTest.insert(invitation).values([memberInvitation, adminInvitation]);

    // 3. Create users for the new members
    const newMemberUser = {
      id: 'user_6',
      name: 'New Member',
      email: 'new-member@example.com',
      emailVerified: true,
    };
    const newAdminUser = {
      id: 'user_7',
      name: 'New Admin',
      email: 'new-admin@example.com',
      emailVerified: true,
    };
    await dbTest.insert(user).values([newMemberUser, newAdminUser]);

    // 4. Add them to the organization
    await dbTest.insert(member).values([
      {
        id: 'member_6',
        organizationId: org.id,
        userId: newMemberUser.id,
        role: 'member',
        createdAt: new Date(),
      },
      {
        id: 'member_7',
        organizationId: org.id,
        userId: newAdminUser.id,
        role: 'admin',
        createdAt: new Date(),
      },
    ]);

    // 5. Assertions
    const orgMembers = await dbTest
      .select()
      .from(member)
      .where(eq(member.organizationId, org.id));

    const memberRole = orgMembers.find(
      (m) => m.userId === newMemberUser.id
    )?.role;
    const adminRole = orgMembers.find(
      (m) => m.userId === newAdminUser.id
    )?.role;

    expect(orgMembers).toHaveLength(3); // owner, member, admin
    expect(memberRole).toBe('member');
    expect(adminRole).toBe('admin');
  });

  it('should correctly store Stripe subscription data for an organization', async () => {
    // 1. Setup organization
    const owner = {
      id: 'user_8',
      name: 'Stripe Test Owner',
      email: 'stripe-owner@example.com',
      emailVerified: true,
    };
    await dbTest.insert(user).values(owner);

    const org = {
      id: 'org_5',
      name: 'Stripe Test Org',
      createdAt: new Date(),
    };
    await dbTest.insert(organization).values(org);

    // 2. Simulate creating a Stripe subscription and update the organization
    const stripeData = {
      stripeCustomerId: 'cus_12345',
      stripeSubscriptionId: 'sub_12345',
      stripeProductId: 'prod_12345',
      planName: 'Pro Plan',
      subscriptionStatus: 'active',
    };

    await dbTest
      .update(organization)
      .set(stripeData)
      .where(eq(organization.id, org.id));

    // 3. Assertions
    const updatedOrg = await dbTest
      .select()
      .from(organization)
      .where(eq(organization.id, org.id));

    expect(updatedOrg).toHaveLength(1);
    expect(updatedOrg[0].stripeCustomerId).toBe(stripeData.stripeCustomerId);
    expect(updatedOrg[0].stripeSubscriptionId).toBe(
      stripeData.stripeSubscriptionId
    );
    expect(updatedOrg[0].stripeProductId).toBe(stripeData.stripeProductId);
    expect(updatedOrg[0].planName).toBe(stripeData.planName);
    expect(updatedOrg[0].subscriptionStatus).toBe(
      stripeData.subscriptionStatus
    );
  });
});
