import { base44 } from '@/api/base44Client';
import { basePermissions } from './adminPermissions';
import { checkIsAdmin } from './profileAdmin';
import { recipientContactIds } from './dmRouting';

/**
 * Messaging access, resolved once per page load.
 *
 * Three distinct levels:
 *  - isFullAdmin: rank admin/super_admin (or the legacy owner name). Keeps the
 *    broad inbox: bulk messaging, gifting, starting conversations.
 *  - canManageDMs: the granular manageDMs permission from an assigned role. Also
 *    unlocks the broad management tools. This stays SEPARATE from being a
 *    contact recipient — a contact recipient never inherits these powers.
 *  - isContactRecipient: this profile is linked to at least one DMContact, which
 *    grants ONLY a personal inbox of the conversations addressed to them.
 */
export async function resolveMessagingAccess(profile, contacts) {
  const isFullAdmin = checkIsAdmin(profile);
  let canManageDMs = isFullAdmin;

  const roleIds = Array.isArray(profile?.assignedRoleIds) ? profile.assignedRoleIds : [];
  if (!isFullAdmin && roleIds.length > 0) {
    try {
      const roles = await base44.entities.Role.list();
      const merged = basePermissions();
      roles
        .filter((r) => roleIds.includes(r.id))
        .forEach((r) => {
          const perms = r.permissions || {};
          Object.keys(merged).forEach((k) => {
            merged[k] = merged[k] || !!perms[k];
          });
        });
      canManageDMs = !!merged.manageDMs;
    } catch (err) {
      console.error('Could not resolve role permissions for messaging', err);
      canManageDMs = false;
    }
  }

  const linkedContactIds = recipientContactIds(contacts, profile?.id);
  const isContactRecipient = linkedContactIds.length > 0;

  return {
    isFullAdmin,
    canManageDMs,
    isContactRecipient,
    linkedContactIds,
    // Broad inbox (bulk messaging, gifting, contact tools).
    canUseFullInbox: isFullAdmin || canManageDMs,
    // Any recipient inbox, broad or personal.
    hasRecipientInbox: isFullAdmin || canManageDMs || isContactRecipient,
  };
}