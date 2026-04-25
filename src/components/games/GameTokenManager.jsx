/**
 * Hook + utility for the game builder token system.
 * - Regular users: 3 tokens/month (configurable via AppSetting 'game_builder_token_cost')
 * - Admins/game creators: unlimited
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const DEFAULT_MONTHLY = 3;
const DEFAULT_COST = 1; // tokens per message

function getPeriodKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function useGameTokens(profile, isAdmin) {
  const [tokenRecord, setTokenRecord] = useState(null);
  const [globalCost, setGlobalCost] = useState(DEFAULT_COST);
  const [globalMonthly, setGlobalMonthly] = useState(DEFAULT_MONTHLY);
  const [loading, setLoading] = useState(true);

  const periodKey = getPeriodKey();

  useEffect(() => {
    if (!profile) return;
    loadTokens();
  }, [profile?.id]);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const [settings, records] = await Promise.all([
        base44.entities.AppSetting.filter({ key: 'game_builder_settings' }),
        base44.entities.GameBuilderToken.filter({ profileId: profile.id, periodKey }),
      ]);
      const s = settings[0]?.value || {};
      setGlobalCost(s.tokenCost ?? DEFAULT_COST);
      setGlobalMonthly(s.monthlyTokens ?? DEFAULT_MONTHLY);

      let rec = records[0];
      if (!rec) {
        rec = await base44.entities.GameBuilderToken.create({
          profileId: profile.id,
          username: profile.username,
          tokensUsed: 0,
          tokensGranted: 0,
          monthlyLimit: s.monthlyTokens ?? DEFAULT_MONTHLY,
          periodKey,
        });
      }
      setTokenRecord(rec);
    } catch (e) {
      console.error('Token load error:', e);
    }
    setLoading(false);
  };

  // Returns true if user can send a message (has tokens), false otherwise
  // Also deducts the token
  const consumeToken = async () => {
    if (isAdmin) return true; // unlimited
    if (!tokenRecord) return false;

    const limit = tokenRecord.monthlyLimit ?? globalMonthly;
    const totalAvailable = limit + (tokenRecord.tokensGranted || 0);
    const used = tokenRecord.tokensUsed || 0;

    if (used + globalCost > totalAvailable) return false;

    const updated = await base44.entities.GameBuilderToken.update(tokenRecord.id, {
      tokensUsed: used + globalCost,
    });
    setTokenRecord(updated);
    return true;
  };

  const tokensLeft = () => {
    if (isAdmin) return Infinity;
    if (!tokenRecord) return 0;
    const limit = tokenRecord.monthlyLimit ?? globalMonthly;
    const total = limit + (tokenRecord.tokensGranted || 0);
    return Math.max(0, total - (tokenRecord.tokensUsed || 0));
  };

  return { tokenRecord, globalCost, globalMonthly, loading, consumeToken, tokensLeft, reload: loadTokens };
}