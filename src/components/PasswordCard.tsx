import React, { useState } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { PasswordEntry } from '../types';
import { getEnvironmentByValue } from '../utils/crypto';

interface PasswordCardProps {
  entry: PasswordEntry;
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onCopyPassword: (password: string) => void;
  onCopyUsername: (username: string) => void;
}

const PasswordCard: React.FC<PasswordCardProps> = ({
  entry,
  onEdit,
  onDelete,
  onCopyPassword,
  onCopyUsername,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const envOption = getEnvironmentByValue(entry.environment);

  const togglePasswordVisibility = (accountId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  const handleCopy = async (text: string, type: 'password' | 'username', id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(`${type}-${id}`);
      setTimeout(() => setCopiedId(null), 1500);
      if (type === 'password') {
        onCopyPassword(text);
      } else {
        onCopyUsername(text);
      }
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleOpenUrl = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (!url) return;
    // 确保URL有协议前缀
    const fullUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;
    try {
      await openUrl(fullUrl);
    } catch (err) {
      console.error('打开链接失败:', err);
    }
  };

  return (
    <div className="password-card">
      <div className="card-header" onClick={() => setExpanded(!expanded)}>
        <div className="card-logo">
          <div className="logo-placeholder" style={{ backgroundColor: getRandomColor(entry.websiteName) }}>
            {getInitials(entry.websiteName)}
          </div>
        </div>
        <div className="card-info">
          <h3 className="card-title">{entry.websiteName}</h3>
          <p
            className={`card-url ${entry.url ? 'card-url-link' : ''}`}
            onClick={entry.url ? (e) => handleOpenUrl(e, entry.url) : undefined}
            title={entry.url ? `点击访问 ${entry.url}` : undefined}
          >
            {entry.url || '未设置网址'}
          </p>
          <div className="card-meta">
            {envOption && (
              <span
                className="env-badge"
                style={{ backgroundColor: envOption.color }}
              >
                {envOption.label}
              </span>
            )}
            {entry.tags.map((tag) => (
              <span key={tag} className="tag-badge">
                {tag}
              </span>
            ))}
            <span className="account-count">
              {entry.accounts.length} 个账号
            </span>
          </div>
        </div>
        <div className="card-expand">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={expanded ? 'expanded' : ''}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="card-body">
          {entry.accounts.map((account) => (
            <div key={account.id} className="account-row">
              <div className="account-field">
                <label>用户名</label>
                <div className="field-value">
                  <span>{account.username}</span>
                  <button
                    className={`copy-btn ${copiedId === `username-${account.id}` ? 'copied' : ''}`}
                    onClick={() => handleCopy(account.username, 'username', account.id)}
                    title="复制用户名"
                  >
                    {copiedId === `username-${account.id}` ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="account-field">
                <label>密码</label>
                <div className="field-value">
                  <span className="password-text">
                    {showPasswords[account.id] ? account.password : '••••••••'}
                  </span>
                  <button
                    className="copy-btn toggle-btn"
                    onClick={() => togglePasswordVisibility(account.id)}
                    title={showPasswords[account.id] ? '隐藏密码' : '显示密码'}
                  >
                    {showPasswords[account.id] ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                  <button
                    className={`copy-btn ${copiedId === `password-${account.id}` ? 'copied' : ''}`}
                    onClick={() => handleCopy(account.password, 'password', account.id)}
                    title="复制密码"
                  >
                    {copiedId === `password-${account.id}` ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="card-actions">
            <button className="action-btn edit-btn" onClick={() => onEdit(entry)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              编辑
            </button>
            <button className="action-btn delete-btn" onClick={() => onDelete(entry.id)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function getRandomColor(str: string): string {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default PasswordCard;
