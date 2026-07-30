import { useState, useEffect, useCallback, useRef } from 'react';
import { PasswordEntry, ThemeType } from '../types';
import {
  hasMasterPassword,
  setMasterPassword as saveMasterPassword,
  verifyMasterPassword,
  encrypt,
  decrypt,
  saveEntries,
  getEncryptedEntries,
  getTheme,
  saveTheme,
  getLockTimeout,
} from '../utils/crypto';

interface UseAppStateReturn {
  isLocked: boolean;
  isFirstTime: boolean;
  theme: ThemeType;
  masterPassword: string;
  entries: PasswordEntry[];
  setMasterPassword: (password: string) => void;
  authenticate: (password: string) => boolean;
  changeMasterPassword: (oldPassword: string, newPassword: string) => boolean;
  lock: () => void;
  setTheme: (theme: ThemeType) => void;
  updateEntries: (entries: PasswordEntry[]) => void;
  resetApp: () => void;
}

export function useAppState(): UseAppStateReturn {
  const [isLocked, setIsLocked] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(!hasMasterPassword());
  const [theme, setThemeState] = useState<ThemeType>(
    (getTheme() as ThemeType) || 'auto'
  );
  const [masterPassword, setMasterPasswordState] = useState('');
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const activityTimerRef = useRef<number | null>(null);

  // 加载保存的条目
  const loadEntries = useCallback((password: string) => {
    const encrypted = getEncryptedEntries();
    if (encrypted) {
      try {
        const decrypted = decrypt(encrypted, password);
        return JSON.parse(decrypted) as PasswordEntry[];
      } catch {
        return [];
      }
    }
    return [];
  }, []);

  // 保存条目（加密后）
  const saveEntriesEncrypted = useCallback(
    (newEntries: PasswordEntry[], password: string) => {
      const json = JSON.stringify(newEntries);
      const encrypted = encrypt(json, password);
      saveEntries(encrypted);
      setEntries(newEntries);
    },
    []
  );

  // 验证密码并解锁
  const authenticate = useCallback(
    (password: string): boolean => {
      if (verifyMasterPassword(password)) {
        setMasterPasswordState(password);
        setIsLocked(false);
        setEntries(loadEntries(password));
        resetActivityTimer();
        return true;
      }
      return false;
    },
    [loadEntries]
  );

  // 首次设置密码
  const setMasterPassword = useCallback((password: string) => {
    saveMasterPassword(password);
    setMasterPasswordState(password);
    setIsFirstTime(false);
    setIsLocked(false);
    setEntries([]);
    resetActivityTimer();
  }, []);

  // 修改主密码
  const changeMasterPassword = useCallback(
    (oldPassword: string, newPassword: string): boolean => {
      // 先验证旧密码
      if (!verifyMasterPassword(oldPassword)) {
        return false;
      }

      // 先解密所有数据
      const encrypted = getEncryptedEntries();
      let decryptedEntries: PasswordEntry[] = [];
      if (encrypted) {
        try {
          const decrypted = decrypt(encrypted, oldPassword);
          decryptedEntries = JSON.parse(decrypted) as PasswordEntry[];
        } catch {
          return false;
        }
      }

      // 设置新密码
      saveMasterPassword(newPassword);
      setMasterPasswordState(newPassword);

      // 用新密码重新加密数据
      if (decryptedEntries.length > 0) {
        const json = JSON.stringify(decryptedEntries);
        const newEncrypted = encrypt(json, newPassword);
        saveEntries(newEncrypted);
      }

      resetActivityTimer();
      return true;
    },
    []
  );

  // 锁定
  const lock = useCallback(() => {
    setIsLocked(true);
    setMasterPasswordState('');
    setEntries([]);
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
      activityTimerRef.current = null;
    }
  }, []);

  // 重置活动计时器
  const resetActivityTimer = useCallback(() => {
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }
    activityTimerRef.current = window.setTimeout(() => {
      lock();
    }, getLockTimeout());
  }, [lock]);

  // 更新条目
  const updateEntries = useCallback(
    (newEntries: PasswordEntry[]) => {
      if (masterPassword) {
        saveEntriesEncrypted(newEntries, masterPassword);
        resetActivityTimer();
      }
    },
    [masterPassword, saveEntriesEncrypted, resetActivityTimer]
  );

  // 设置主题
  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
  }, []);

  // 重置整个应用
  const resetApp = useCallback(() => {
    localStorage.clear();
    setIsFirstTime(true);
    setIsLocked(true);
    setEntries([]);
    setMasterPasswordState('');
  }, []);

  // 监听用户活动以重置计时器
  useEffect(() => {
    if (!isLocked && masterPassword) {
      const handleActivity = () => {
        resetActivityTimer();
      };

      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('click', handleActivity);

      return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('click', handleActivity);
      };
    }
  }, [isLocked, masterPassword, resetActivityTimer]);

  // 应用主题到 document
  useEffect(() => {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      document.documentElement.setAttribute(
        'data-theme',
        prefersDark ? 'dark' : 'light'
      );
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
    };
  }, []);

  return {
    isLocked,
    isFirstTime,
    theme,
    masterPassword,
    entries,
    setMasterPassword,
    authenticate,
    changeMasterPassword,
    lock,
    setTheme,
    updateEntries,
    resetApp,
  };
}
