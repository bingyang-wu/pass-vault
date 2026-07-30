// 条目类型
export type EntryType = 'website' | 'database';

// 账号信息
export interface AccountInfo {
  id: string;
  username: string;
  password: string;
}

// 数据库连接信息
export interface DatabaseConnectionInfo {
  dbType: string;       // MySQL, PostgreSQL, MongoDB, Redis, SQLServer 等
  host: string;
  port: string;
  databaseName: string;
  username: string;
  password: string;
  remark?: string;
}

// 密码条目
export interface PasswordEntry {
  id: string;
  type: EntryType;      // 条目类型，默认 'website'
  websiteName: string;   // 网站名称 / 数据库连接名称
  url: string;           // 网址 / 可留空
  tags: string[];
  environment: string;
  accounts: AccountInfo[];          // 网站类型的账号列表
  database?: DatabaseConnectionInfo; // 数据库类型的连接信息
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

// 数据库类型选项
export const DATABASE_TYPES = [
  'MySQL',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'SQLServer',
  'Oracle',
  'SQLite',
  'MariaDB',
];

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
