// Single source of truth for admin role permissions.
// Shared by the Role entity schema, RolesManager UI, and Admin.jsx gating
// so they can never drift out of sync.

export const PERMISSIONS = [
  { key: "accessAI", label: "Access AI tools" },
  { key: "manageAssignments", label: "Manage assignments" },
  { key: "manageSuperAssignments", label: "Manage super assignments" },
  { key: "viewAnalytics", label: "View analytics" },
  { key: "managePets", label: "Manage pets" },
  { key: "manageThemes", label: "Manage themes" },
  { key: "manageCosmetics", label: "Manage cosmetics" },
  { key: "manageShop", label: "Manage shop" },
  { key: "manageEvents", label: "Manage events" },
  { key: "manageKitchen", label: "Manage kitchen" },
  { key: "manageLocks", label: "Manage locks" },
  { key: "banFlagUsers", label: "Ban/flag users" },
  { key: "grantAdminTokens", label: "Grant admin tokens" },
  { key: "toggleAdminRole", label: "Toggle admin role" },
  { key: "deleteAssets", label: "Delete assets" },
  { key: "manageSeasons", label: "Manage seasons (1Pass)" },
  { key: "manageLootEggs", label: "Manage loot eggs" },
  { key: "manageMusic", label: "Manage music" },
  { key: "manageEmail", label: "Manage email broadcasts" },
  { key: "manageRedeemCodes", label: "Manage redeem codes" },
  { key: "manageDMs", label: "Manage DMs" },
  { key: "manageDailyRewards", label: "Manage daily rewards" },
  { key: "manageWheelLibrary", label: "Manage wheel library" },
  { key: "manageSettings", label: "Manage settings" },
];

const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

export const basePermissions = () =>
  Object.fromEntries(PERMISSION_KEYS.map((k) => [k, false]));

export const allPermissions = () =>
  Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true]));

// Permissions a plain admin (rank=admin, no custom role) keeps by default.
// These are the features that were visible to every admin before role-gating
// was added, so existing admins see exactly what they saw before.
export const defaultAdminPermissions = () => ({
  ...basePermissions(),
  manageSeasons: true,
  manageLootEggs: true,
  manageMusic: true,
  manageEmail: true,
  manageRedeemCodes: true,
  manageDMs: true,
  manageDailyRewards: true,
  manageWheelLibrary: true,
  manageSettings: true,
});