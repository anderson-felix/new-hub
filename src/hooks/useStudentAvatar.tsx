import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  DEFAULT_AVATAR,
  getEquippedPaidItemKeys,
  type AvatarConfig,
} from '@/components/dashboard/student/AvatarCustomizer';
import { useUser } from '@/hooks/useUser';

interface StudentAvatarContextValue {
  avatar: AvatarConfig;
  setAvatar: (cfg: AvatarConfig) => void;
  unlockedItems: string[];
  setUnlockedItems: (items: string[]) => void;
  unlockAvatarItem: (key: string) => string[];
}

const StudentAvatarContext = createContext<StudentAvatarContextValue | undefined>(undefined);

const STORAGE_KEY = 'picode.studentAvatar';
const UNLOCKED_STORAGE_KEY = 'picode.studentAvatar.unlocked';

export const StudentAvatarProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();

  const [avatar, setAvatarState] = useState<AvatarConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AvatarConfig) : DEFAULT_AVATAR;
    } catch {
      return DEFAULT_AVATAR;
    }
  });

  const [unlockedItems, setUnlockedItemsState] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(UNLOCKED_STORAGE_KEY);
      const parsed: string[] = raw ? JSON.parse(raw) : [];
      const initialAvatarRaw = localStorage.getItem(STORAGE_KEY);
      const initialAvatar = initialAvatarRaw ? (JSON.parse(initialAvatarRaw) as AvatarConfig) : null;
      const equipped = getEquippedPaidItemKeys(initialAvatar);
      return Array.from(new Set([...(Array.isArray(parsed) ? parsed : []), ...equipped]));
    } catch {
      return [];
    }
  });

  // Sync from user.metadata when authenticated user loads/updates
  useEffect(() => {
    const remoteConfig = user?.metadata?.avatar_config as AvatarConfig | undefined;
    if (remoteConfig && typeof remoteConfig === 'object' && remoteConfig.seed) {
      setAvatarState((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(remoteConfig)) return prev;
        return { ...DEFAULT_AVATAR, ...remoteConfig };
      });
    }

    const remoteUnlocked = Array.isArray(user?.metadata?.unlocked_avatar_items)
      ? (user?.metadata?.unlocked_avatar_items as string[])
      : [];
    const equippedKeys = getEquippedPaidItemKeys(remoteConfig || avatar);

    if (remoteUnlocked.length > 0 || equippedKeys.length > 0) {
      setUnlockedItemsState((prev) => {
        const merged = Array.from(new Set([...prev, ...remoteUnlocked, ...equippedKeys]));
        if (merged.length === prev.length && merged.every((k, i) => k === prev[i])) {
          return prev;
        }
        return merged;
      });
    }
  }, [user?.id, user?.metadata?.avatar_config, user?.metadata?.unlocked_avatar_items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(avatar));
    } catch {
      /* ignore */
    }
  }, [avatar]);

  useEffect(() => {
    try {
      localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(unlockedItems));
    } catch {
      /* ignore */
    }
  }, [unlockedItems]);

  const unlockAvatarItem = useCallback((key: string): string[] => {
    let nextList: string[] = [];
    setUnlockedItemsState((prev) => {
      nextList = Array.from(new Set([...prev, key]));
      try {
        localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(nextList));
      } catch {
        /* ignore */
      }
      return nextList;
    });
    return nextList;
  }, []);

  const value = useMemo<StudentAvatarContextValue>(
    () => ({
      avatar,
      setAvatar: setAvatarState,
      unlockedItems,
      setUnlockedItems: setUnlockedItemsState,
      unlockAvatarItem,
    }),
    [avatar, unlockedItems, unlockAvatarItem]
  );

  return <StudentAvatarContext.Provider value={value}>{children}</StudentAvatarContext.Provider>;
};

export const useStudentAvatar = () => {
  const ctx = useContext(StudentAvatarContext);
  if (!ctx) throw new Error('useStudentAvatar must be used within StudentAvatarProvider');
  return ctx;
};
