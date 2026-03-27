import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { useAppDispatch } from '@/hooks';
import { getMeThunk } from '@/features/auth/slices/authSlice';
import { authService } from '@/features/auth/services/authService';
import { tierService, CustomerTier } from '@/features/tickets/services/tierService';
import toast from 'react-hot-toast';

export function useSubscription() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const [tiers, setTiers] = useState<CustomerTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<CustomerTier | null>(null);

  const currentTierId = user?.customer_tier_id ?? null;

  const loadTiers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await tierService.listTiers();
      setTiers(data);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  async function applyTier(tier: CustomerTier) {
    if (!user || tier.tier_id === currentTierId) return;
    setSaving(tier.tier_id);
    setConfirm(null);
    try {
      await authService.updateUser(user.id, { customer_tier_id: tier.tier_id });
      await dispatch(getMeThunk());
      toast.success(`Switched to ${tier.name}`);
    } catch {
      toast.error('Failed to switch plan. Please try again.');
    } finally {
      setSaving(null);
    }
  }

  const currentTier = tiers.find((t) => t.tier_id === currentTierId);

  return {
    tiers,
    isLoading,
    saving,
    confirm,
    setConfirm,
    currentTierId,
    currentTier,
    loadTiers,
    applyTier,
  };
}
