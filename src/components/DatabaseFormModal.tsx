import React, { useState, useEffect } from 'react';
import { PasswordEntry, EnvironmentOption, DATABASE_TYPES } from '../types';
import { generateId, getAllEnvironmentOptions, addCustomEnvironment, removeCustomEnvironment } from '../utils/crypto';
import PasswordGenerator from './PasswordGenerator';

interface DatabaseFormModalProps {
  entry?: PasswordEntry | null;
  onSave: (entry: PasswordEntry) => void;
  onClose: () => void;
}

const DatabaseFormModal: React.FC<DatabaseFormModalProps> = ({ entry, onSave, onClose }) => {
  const [connectionName, setConnectionName] = useState('');
  const [dbType, setDbType] = useState('MySQL');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remark, setRemark] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [environment, setEnvironment] = useState<string>('production');
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 环境相关状态
  const [envOptions, setEnvOptions] = useState<EnvironmentOption[]>(getAllEnvironmentOptions());
  const [envInput, setEnvInput] = useState('');
  const [showEnvInput, setShowEnvInput] = useState(false);
  const [hoveredEnv, setHoveredEnv] = useState<string | null>(null);

  // 数据库默认端口
  const defaultPorts: Record<string, string> = {
    'MySQL': '3306',
    'PostgreSQL': '5432',
    'MongoDB': '27017',
    'Redis': '6379',
    'SQLServer': '1433',
    'Oracle': '1521',
    'SQLite': '',
    'MariaDB': '3306',
  };

  useEffect(() => {
    if (entry?.database) {
      const db = entry.database;
      setConnectionName(entry.websiteName);
      setDbType(db.dbType);
      setHost(db.host);
      setPort(db.port);
      setDatabaseName(db.databaseName);
      setUsername(db.username);
      setPassword(db.password);
      setRemark(db.remark || '');
      setTags(entry.tags);
      setEnvironment(entry.environment);
    }
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

  const handleDbTypeChange = (type: string) => {
    setDbType(type);
    // 自动填充默认端口（仅在端口为空时）
    if (!port && defaultPorts[type]) {
      setPort(defaultPorts[type]);
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

  const handleDeleteEnvironment = (e: React.MouseEvent, env: EnvironmentOption) => {
    e.stopPropagation();
    if (env.isCustom) {
      if (window.confirm(`确定要删除环境"${env.label}"吗？`)) {
        removeCustomEnvironment(env.value);
        setEnvOptions(envOptions.filter(e => e.value !== env.value));
        if (environment === env.value) {
          setEnvironment('production');
        }
      }
    }
  };

  const handleApplyGeneratedPassword = (pwd: string) => {
    setPassword(pwd);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectionName.trim()) {
      alert('请输入连接名称');
      return;
    }

    if (!host.trim()) {
      alert('请输入主机地址');
      return;
    }

    const now = Date.now();
    const savedEntry: PasswordEntry = {
      id: entry?.id || generateId(),
      type: 'database',
      websiteName: connectionName.trim(),
      url: '',
      tags,
      environment,
      accounts: [],
      database: {
        dbType,
        host: host.trim(),
        port: port.trim(),
        databaseName: databaseName.trim(),
        username: username.trim(),
        password,
        remark: remark.trim() || undefined,
      },
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
            <h3>{entry ? '编辑数据库连接' : '添加数据库连接'}</h3>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="entry-form">
            {/* 基本信息区 */}
            <div className="form-section">
              <div className="form-group">
                <label>
                  <span className="label-icon">🔌</span>
                  连接名称
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  placeholder="例如：生产环境MySQL"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group form-group-half">
                  <label>
                    <span className="label-icon">🗄️</span>
                    数据库类型
                  </label>
                  <select
                    value={dbType}
                    onChange={(e) => handleDbTypeChange(e.target.value)}
                    className="db-type-select"
                  >
                    {DATABASE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
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
                          onClick={() => setEnvironment(opt.value)}
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
              </div>

              <div className="form-row">
                <div className="form-group form-group-half">
                  <label>
                    <span className="label-icon">🌐</span>
                    主机地址
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="例如：192.168.1.100"
                    required
                  />
                </div>
                <div className="form-group form-group-half">
                  <label>
                    <span className="label-icon">🚪</span>
                    端口
                  </label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="例如：3306"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <span className="label-icon">📦</span>
                  数据库名称
                </label>
                <input
                  type="text"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  placeholder="例如：my_database"
                />
              </div>
            </div>

            {/* 认证信息区 */}
            <div className="form-section">
              <div className="section-header">
                <h4>
                  <span className="label-icon">🔐</span>
                  认证信息
                </h4>
              </div>
              <div className="form-row">
                <div className="form-group form-group-half">
                  <label>用户名</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="输入用户名"
                  />
                </div>
                <div className="form-group form-group-half">
                  <label>密码</label>
                  <div className="password-field-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="输入密码"
                      className="password-field"
                    />
                    <button
                      type="button"
                      className="generate-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? '隐藏密码' : '显示密码'}
                    >
                      {showPassword ? (
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
                      onClick={() => setShowPasswordGenerator(true)}
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

              <div className="form-group">
                <label>
                  <span className="label-icon">📝</span>
                  备注
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="可选备注信息"
                  rows={2}
                />
              </div>
            </div>

            {/* 标签区 */}
            <div className="form-section">
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

export default DatabaseFormModal;
