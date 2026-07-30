import React, { useState, useEffect } from 'react';
import { PasswordEntry, AccountInfo, EnvironmentOption } from '../types';
import { generateId, getAllEnvironmentOptions, addCustomEnvironment, removeCustomEnvironment } from '../utils/crypto';
import PasswordGenerator from './PasswordGenerator';

interface EntryFormModalProps {
  entry?: PasswordEntry | null;
  onSave: (entry: PasswordEntry) => void;
  onClose: () => void;
}

const EntryFormModal: React.FC<EntryFormModalProps> = ({ entry, onSave, onClose }) => {
  const [websiteName, setWebsiteName] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [environment, setEnvironment] = useState<string>('production');
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [showAccountPasswords, setShowAccountPasswords] = useState<Record<string, boolean>>({});

  // 环境相关状态
  const [envOptions, setEnvOptions] = useState<EnvironmentOption[]>(getAllEnvironmentOptions());
  const [envInput, setEnvInput] = useState('');
  const [showEnvInput, setShowEnvInput] = useState(false);
  const [hoveredEnv, setHoveredEnv] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setWebsiteName(entry.websiteName);
      setUrl(entry.url);
      setTags(entry.tags);
      setEnvironment(entry.environment);
      setAccounts([...entry.accounts]);
    }
    // 每次打开时刷新环境选项
    setEnvOptions(getAllEnvironmentOptions());
  }, [entry]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddEnvironment = () => {
    if (envInput.trim()) {
      const newEnv = addCustomEnvironment(envInput.trim());
      setEnvOptions([...envOptions, newEnv]);
      setEnvironment(newEnv.value);
      setEnvInput('');
      setShowEnvInput(false);
    }
  };

  const handleEnvKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEnvironment();
    }
  };

  const handleSelectEnvironment = (value: string) => {
    setEnvironment(value);
  };

  const handleDeleteEnvironment = (e: React.MouseEvent, env: EnvironmentOption) => {
    e.stopPropagation();
    if (env.isCustom) {
      if (window.confirm(`确定要删除环境"${env.label}"吗？`)) {
        removeCustomEnvironment(env.value);
        setEnvOptions(envOptions.filter(e => e.value !== env.value));
        // 如果删除的是当前选中的环境，重置为生产环境
        if (environment === env.value) {
          setEnvironment('production');
        }
      }
    }
  };

  const handleAddAccount = () => {
    const newAccount: AccountInfo = {
      id: generateId(),
      username: '',
      password: '',
    };
    setAccounts([...accounts, newAccount]);
    setEditingAccountId(newAccount.id);
  };

  const handleUpdateAccount = (id: string, field: keyof AccountInfo, value: string) => {
    setAccounts(
      accounts.map((acc) => (acc.id === id ? { ...acc, [field]: value } : acc))
    );
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts(accounts.filter((acc) => acc.id !== id));
  };

  const handleApplyGeneratedPassword = (password: string) => {
    if (editingAccountId) {
      handleUpdateAccount(editingAccountId, 'password', password);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!websiteName.trim()) {
      alert('请输入网站名称');
      return;
    }

    if (!url.trim()) {
      alert('请输入网址');
      return;
    }

    const validAccounts = accounts.filter(
      (acc) => acc.username.trim() && acc.password.trim()
    );

    const now = Date.now();
    const savedEntry: PasswordEntry = {
      id: entry?.id || generateId(),
      websiteName: websiteName.trim(),
      url: url.trim(),
      tags,
      environment,
      accounts: validAccounts,
      createdAt: entry?.createdAt || now,
      updatedAt: now,
    };

    onSave(savedEntry);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="entry-form-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{entry ? '编辑密码' : '添加密码'}</h3>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="entry-form">
            {/* 头部信息区 */}
            <div className="form-section">
              <div className="form-group">
                <label>
                  <span className="label-icon">🌐</span>
                  网站名称
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={websiteName}
                  onChange={(e) => setWebsiteName(e.target.value)}
                  placeholder="例如：GitHub、Google"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <span className="label-icon">🔗</span>
                  网址
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group form-group-half">
                  <label>
                    <span className="label-icon">⚡</span>
                    环境
                  </label>
                  <div className="env-selector">
                    {envOptions.map((opt) => (
                      <div
                        key={opt.value}
                        className={`env-option-wrapper ${environment === opt.value ? 'active' : ''}`}
                        onMouseEnter={() => setHoveredEnv(opt.value)}
                        onMouseLeave={() => setHoveredEnv(null)}
                      >
                        <button
                          type="button"
                          className={`env-option ${environment === opt.value ? 'active' : ''}`}
                          style={
                            environment === opt.value
                              ? { borderColor: opt.color, backgroundColor: opt.color + '20' }
                              : {}
                          }
                          onClick={() => handleSelectEnvironment(opt.value)}
                        >
                          <span className="env-dot" style={{ backgroundColor: opt.color }}></span>
                          <span className="env-label">{opt.label}</span>
                        </button>
                        {opt.isCustom && hoveredEnv === opt.value && (
                          <button
                            type="button"
                            className="env-delete-btn"
                            onClick={(e) => handleDeleteEnvironment(e, opt)}
                            title="删除环境"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="env-option add-env-btn"
                      onClick={() => setShowEnvInput(true)}
                    >
                      + 添加
                    </button>
                  </div>
                  {showEnvInput && (
                    <div className="env-input-row">
                      <input
                        type="text"
                        value={envInput}
                        onChange={(e) => setEnvInput(e.target.value)}
                        onKeyDown={handleEnvKeyDown}
                        placeholder="输入环境名称后按回车添加"
                        autoFocus
                        className="env-input"
                      />
                      <button type="button" className="btn-primary env-confirm-btn" onClick={handleAddEnvironment}>
                        添加
                      </button>
                      <button type="button" className="btn-secondary env-cancel-btn" onClick={() => {
                        setShowEnvInput(false);
                        setEnvInput('');
                      }}>
                        取消
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group form-group-half">
                  <label>
                    <span className="label-icon">🏷️</span>
                    标签
                  </label>
                  <div className="tags-input-container">
                    <div className="tags-list">
                      {tags.map((tag) => (
                        <span key={tag} className="tag-item">
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)}>&times;</button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="输入标签后按回车添加"
                      className="tag-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 账号列表 */}
            <div className="form-section">
              <div className="section-header">
                <h4>
                  <span className="label-icon">👤</span>
                  账号列表
                </h4>
              </div>
              <div className="accounts-list">
                {accounts.map((account, index) => (
                  <div key={account.id} className="account-item">
                    <div className="account-left">
                      <div className="account-number">#{index + 1}</div>
                      <button
                        type="button"
                        className="remove-account-btn"
                        onClick={() => handleRemoveAccount(account.id)}
                        title="删除账号"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                    <div className="account-fields">
                      <div className="account-field-group">
                        <label>用户名</label>
                        <input
                          type="text"
                          value={account.username}
                          onChange={(e) => handleUpdateAccount(account.id, 'username', e.target.value)}
                          placeholder="输入用户名"
                        />
                      </div>
                      <div className="account-field-group">
                        <label>密码</label>
                        <div className="password-field-wrapper">
                          <input
                            type={showAccountPasswords[account.id] ? 'text' : 'password'}
                            value={account.password}
                            onChange={(e) => handleUpdateAccount(account.id, 'password', e.target.value)}
                            placeholder="输入密码"
                            className="password-field"
                          />
                          <button
                            type="button"
                            className="generate-btn"
                            onClick={() => setShowAccountPasswords((prev) => ({ ...prev, [account.id]: !prev[account.id] }))}
                            title={showAccountPasswords[account.id] ? '隐藏密码' : '显示密码'}
                          >
                            {showAccountPasswords[account.id] ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            )}
                          </button>
                          <button
                            type="button"
                            className="generate-btn"
                            onClick={() => {
                              setEditingAccountId(account.id);
                              setShowPasswordGenerator(true);
                            }}
                            title="生成密码"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="23 4 23 10 17 10"></polyline>
                              <polyline points="1 20 1 14 7 14"></polyline>
                              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className="add-account-btn" onClick={handleAddAccount}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  添加账号
                </button>
              </div>
            </div>

            {/* 底部操作按钮 */}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                保存
              </button>
            </div>
          </form>
        </div>
      </div>

      {showPasswordGenerator && (
        <PasswordGenerator
          onApply={handleApplyGeneratedPassword}
          onClose={() => setShowPasswordGenerator(false)}
        />
      )}
    </>
  );
};

export default EntryFormModal;
