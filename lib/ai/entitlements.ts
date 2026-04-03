import type { UserType } from "@/app/(auth)/auth";

type Entitlements = {
  maxMessagesPerHour: number;
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  // Kept for compatibility with historical sessions/data.
  guest: {
    maxMessagesPerHour: 10,
  },
  regular: {
    maxMessagesPerHour: 10,
  },
};
