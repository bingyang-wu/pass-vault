// 账号信息
export interface AccountInfo {
  id: string;
  username: string;
  password: string;
}

// 密码条目
export interface PasswordEntry {
  id: string;
  websiteName: string;
  url: string;
  tags: string[];
  environment: string; // 改为字符串，支持自定义环境
  accounts: AccountInfo[];
  createdAt: number;
  updatedAt: number;
}

// 环境选项
export interface EnvironmentOption {
  value: string;
  label: string;
  color: string;
  isCustom?: boolean;
}

// 生成密码的配置
export interface PasswordGeneratorConfig {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
}

// 主题类型
export type ThemeType = 'light' | 'dark' | 'auto';

// 应用状态
export interface AppState {
  isLocked: boolean;
  isFirstTime: boolean;
  theme: ThemeType;
  lastActivityTime: number;
}

// 导入导出数据格式
export interface ExportData {
  version: string;
  entries: PasswordEntry[];
  exportedAt: number;
}

// 默认密码生成配置
export const DEFAULT_PASSWORD_CONFIG: PasswordGeneratorConfig = {
  length: 12,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: false,
  strength: 'weak',
};

// 默认内置环境选项
export const DEFAULT_ENVIRONMENT_OPTIONS: EnvironmentOption[] = [
  { value: 'production', label: '默认环境', color: '#e74c3c' },
];

// 自定义环境存储key
export const CUSTOM_ENVIRONMENTS_KEY = 'passvault_custom_environments';
