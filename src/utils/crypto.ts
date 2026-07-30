import CryptoJS from 'crypto-js';
import { EnvironmentOption, DEFAULT_ENVIRONMENT_OPTIONS, CUSTOM_ENVIRONMENTS_KEY } from '../types';

// 存储的密钥哈希的key
const MASTER_PASSWORD_HASH_KEY = 'passvault_master_password_hash';
const ENTRIES_KEY = 'passvault_entries';
const THEME_KEY = 'passvault_theme';

/**
 * 生成随机颜色
 */
export function generateRandomColor(): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#10b981', '#06b6d4', '#3b82f6', '#14b8a6', '#f97316',
    '#84cc16', '#a855f7', '#0ea5e9', '#e11d48', '#84cc16',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 生成随机盐值
 */
export function generateSalt(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 使用PBKDF2派生密钥
 */
function deriveKey(password: string, salt: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  });
}

/**
 * 验证主密码
 */
export function verifyMasterPassword(password: string): boolean {
  const storedHash = localStorage.getItem(MASTER_PASSWORD_HASH_KEY);
  if (!storedHash) return false;

  try {
    const { hash, salt } = JSON.parse(storedHash);
    const derivedKey = deriveKey(password, salt);
    const derivedHash = CryptoJS.SHA256(derivedKey.toString()).toString();
    return derivedHash === hash;
  } catch {
    return false;
  }
}

/**
 * 设置主密码
 */
export function setMasterPassword(password: string): void {
  const salt = generateSalt();
  const derivedKey = deriveKey(password, salt);
  const hash = CryptoJS.SHA256(derivedKey.toString()).toString();

  localStorage.setItem(
    MASTER_PASSWORD_HASH_KEY,
    JSON.stringify({ hash, salt })
  );
}

/**
 * 检查是否已设置主密码
 */
export function hasMasterPassword(): boolean {
  return localStorage.getItem(MASTER_PASSWORD_HASH_KEY) !== null;
}

/**
 * 加密数据(使用AES-256)
 */
export function encrypt(data: string, password: string): string {
  const salt = generateSalt();
  const key = deriveKey(password, salt);
  const iv = CryptoJS.lib.WordArray.random(16);

  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });

  // 将盐值和IV与密文一起存储
  return JSON.stringify({
    salt: salt,
    iv: iv.toString(),
    ciphertext: encrypted.toString(),
  });
}

/**
 * 解密数据
 */
export function decrypt(encryptedData: string, password: string): string {
  try {
    const { salt, iv, ciphertext } = JSON.parse(encryptedData);
    const key = deriveKey(password, salt);

    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    throw new Error('解密失败，密码可能不正确');
  }
}

/**
 * 保存加密后的密码条目
 */
export function saveEntries(encryptedData: string): void {
  localStorage.setItem(ENTRIES_KEY, encryptedData);
}

/**
 * 获取加密后的密码条目
 */
export function getEncryptedEntries(): string | null {
  return localStorage.getItem(ENTRIES_KEY);
}

/**
 * 保存主题设置
 */
export function saveTheme(theme: string): void {
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * 获取主题设置
 */
export function getTheme(): string {
  return localStorage.getItem(THEME_KEY) || 'auto';
}

/**
 * 获取锁定超时时间(4小时，单位毫秒)
 */
export function getLockTimeout(): number {
  return 4 * 60 * 60 * 1000; // 4小时
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 使用自定义密钥加密(用于导出)
 */
export function encryptWithKey(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

/**
 * 使用自定义密钥解密(用于导入)
 */
export function decryptWithKey(encryptedData: string, key: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    if (!result) {
      throw new Error('解密失败');
    }
    return result;
  } catch {
    throw new Error('解密失败，密钥可能不正确');
  }
}

/**
 * 获取所有环境选项（内置 + 自定义）
 */
export function getAllEnvironmentOptions(): EnvironmentOption[] {
  const customEnvsJson = localStorage.getItem(CUSTOM_ENVIRONMENTS_KEY);
  const customEnvs: EnvironmentOption[] = customEnvsJson ? JSON.parse(customEnvsJson) : [];
  return [...DEFAULT_ENVIRONMENT_OPTIONS, ...customEnvs.map(env => ({ ...env, isCustom: true }))];
}

/**
 * 添加自定义环境
 */
export function addCustomEnvironment(label: string): EnvironmentOption {
  const customEnvsJson = localStorage.getItem(CUSTOM_ENVIRONMENTS_KEY);
  const customEnvs: EnvironmentOption[] = customEnvsJson ? JSON.parse(customEnvsJson) : [];
  
  const newEnv: EnvironmentOption = {
    value: `custom_${Date.now()}`,
    label,
    color: generateRandomColor(),
    isCustom: true,
  };
  
  customEnvs.push(newEnv);
  localStorage.setItem(CUSTOM_ENVIRONMENTS_KEY, JSON.stringify(customEnvs));
  
  return newEnv;
}

/**
 * 删除自定义环境
 */
export function removeCustomEnvironment(value: string): void {
  const customEnvsJson = localStorage.getItem(CUSTOM_ENVIRONMENTS_KEY);
  if (!customEnvsJson) return;
  
  const customEnvs: EnvironmentOption[] = JSON.parse(customEnvsJson);
  const filtered = customEnvs.filter(env => env.value !== value);
  localStorage.setItem(CUSTOM_ENVIRONMENTS_KEY, JSON.stringify(filtered));
}

/**
 * 根据value获取环境选项
 */
export function getEnvironmentByValue(value: string): EnvironmentOption | undefined {
  const allEnvs = getAllEnvironmentOptions();
  return allEnvs.find(env => env.value === value);
}
