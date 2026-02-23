export type PrivacyVisibility = "everyone" | "selected" | "nobody";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  blockedUserIds: string[];
  bio: string;
  birthday: string;
  showLastSeen: boolean;
  lastSeenVisibility: PrivacyVisibility;
  avatarVisibility: PrivacyVisibility;
  bioVisibility: PrivacyVisibility;
  birthdayVisibility: PrivacyVisibility;
  lastSeenAllowedUserIds: string[];
  avatarAllowedUserIds: string[];
  bioAllowedUserIds: string[];
  birthdayAllowedUserIds: string[];
  lastSeenAt: number;
  avatarUrl: string;
  bannerUrl: string;
};
