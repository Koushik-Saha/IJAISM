import { prisma } from '@/lib/prisma';

// Membership tier definitions
export type MembershipTier = 'free' | 'basic' | 'premium' | 'institutional';

// Tier configuration with benefits
export const TIER_CONFIG = {
  free: {
    name: 'Free',
    submissionsPerYear: 0, // View only - no submissions
    priority: 0,
    features: [
      'Access to all published articles',
      'Browse journals and conferences',
      'Basic profile',
    ],
  },
  basic: {
    name: 'Basic',
    submissionsPerYear: 5,
    priority: 1,
    features: [
      'All Free features',
      'Submit up to 5 papers/year',
      'Priority paper review',
      'Basic author dashboard',
      'Email notifications',
      'Author certification badge',
    ],
  },
  premium: {
    name: 'Premium',
    submissionsPerYear: -1, // Unlimited
    priority: 2,
    features: [
      'All Basic features',
      'Unlimited submissions',
      'Enhanced author dashboard',
      'Submission analytics & insights',
      'Early access to new features',
      'Priority email support',
      'Featured author profile',
      'Conference discounts (20%)',
    ],
  },
  institutional: {
    name: 'Institutional',
    submissionsPerYear: -1, // Unlimited
    priority: 3,
    features: [
      'All Premium features',
      'Multiple user accounts (up to 50)',
      'Institutional branding',
      'Dedicated account manager',
      'Custom reporting & analytics',
      'API access',
      'Priority 24/7 support',
      'Bulk submission discounts',
    ],
  },
} as const;

// Get user's current membership
export async function getUserMembership(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      status: 'active',
      endDate: {
        gte: new Date(), // Not expired
      },
    },
    orderBy: {
      endDate: 'desc', // Get the latest active membership
    },
  });

  return membership;
}

// Get user's effective tier (includes free tier for users without membership)
export async function getUserTier(userId: string): Promise<MembershipTier> {
  const membership = await getUserMembership(userId);

  if (!membership) {
    return 'free';
  }

  return membership.tier as MembershipTier;
}

// Count submissions in current year
export async function getSubmissionsThisYear(userId: string): Promise<number> {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1); // Jan 1st of current year
  const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59); // Dec 31st

  const count = await prisma.article.count({
    where: {
      authorId: userId,
      submissionDate: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
  });

  return count;
}

// Check if user can submit based on their tier
export async function canUserSubmit(userId: string): Promise<{
  canSubmit: boolean;
  tier: MembershipTier;
  limit: number;
  used: number;
  remaining: number;
  reason?: string;
}> {
  const tier = await getUserTier(userId);
  const tierConfig = TIER_CONFIG[tier];
  const submissionsThisYear = await getSubmissionsThisYear(userId);

  const limit = tierConfig.submissionsPerYear;
  const isUnlimited = limit === -1;
  const remaining = isUnlimited ? -1 : Math.max(0, limit - submissionsThisYear);
  const canSubmit = isUnlimited || submissionsThisYear < limit;

  let reason: string | undefined;

  if (!canSubmit) {
    if (tier === 'free') {
      reason = 'Free tier does not include article submissions. Please upgrade to Basic or Premium membership.';
    } else if (tier === 'basic') {
      reason = `You have reached your annual limit of ${limit} submissions. Please upgrade to Premium for unlimited submissions.`;
    }
  }

  return {
    canSubmit,
    tier,
    limit,
    used: submissionsThisYear,
    remaining,
    reason,
  };
}

// Get tier name display
export function getTierName(tier: MembershipTier): string {
  return TIER_CONFIG[tier].name;
}

// Get tier features
export function getTierFeatures(tier: MembershipTier): readonly string[] {
  return TIER_CONFIG[tier].features;
}

// Check if tier has feature
export function hasUnlimitedSubmissions(tier: MembershipTier): boolean {
  return TIER_CONFIG[tier].submissionsPerYear === -1;
}

// Get submission limit for tier
export function getSubmissionLimit(tier: MembershipTier): number {
  return TIER_CONFIG[tier].submissionsPerYear;
}

// Compare tiers (for upgrade checks)
export function isUpgrade(fromTier: MembershipTier, toTier: MembershipTier): boolean {
  return TIER_CONFIG[toTier].priority > TIER_CONFIG[fromTier].priority;
}

// Get tier badge color
export function getTierBadgeColor(tier: MembershipTier): string {
  switch (tier) {
    case 'free':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'basic':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'premium':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'institutional':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

// Get membership status with all details
export async function getMembershipStatus(userId: string) {
  const membership = await getUserMembership(userId);
  const tier = membership ? (membership.tier as MembershipTier) : 'free';
  const submissionsThisYear = await getSubmissionsThisYear(userId);
  const tierConfig = TIER_CONFIG[tier];
  const canSubmitResult = await canUserSubmit(userId);

  return {
    tier,
    tierName: tierConfig.name,
    isActive: !!membership,
    startDate: membership?.startDate || null,
    endDate: membership?.endDate || null,
    autoRenew: membership?.autoRenew || false,
    features: tierConfig.features,
    submissions: {
      limit: tierConfig.submissionsPerYear,
      used: submissionsThisYear,
      remaining: canSubmitResult.remaining,
      isUnlimited: tierConfig.submissionsPerYear === -1,
      canSubmit: canSubmitResult.canSubmit,
    },
    membership,
  };
}
