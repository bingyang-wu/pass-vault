import React, { useState, useEffect, useCallback } from 'react';
import { PasswordGeneratorConfig, DEFAULT_PASSWORD_CONFIG } from '../types';

interface PasswordGeneratorProps {
  onApply: (password: string) => void;
  onClose: () => void;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

const STRENGTH_CONFIG = {
  weak: { length: 8, uppercase: false, lowercase: true, numbers: true, symbols: false },
  medium: { length: 12, uppercase: true, lowercase: true, numbers: true, symbols: false },
  strong: { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true },
  'very-strong': { length: 24, uppercase: true, lowercase: true, numbers: true, symbols: true },
};

const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onApply, onClose }) => {
  const [config, setConfig] = useState<PasswordGeneratorConfig>(DEFAULT_PASSWORD_CONFIG);
  const [password, setPassword] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    let chars = '';
    if (config.uppercase) chars += UPPERCASE;
    if (config.lowercase) chars += LOWERCASE;
    if (config.numbers) chars += NUMBERS;
    if (config.symbols) chars += SYMBOLS;

    if (chars === '') chars = LOWERCASE;

    let result = '';
    const array = new Uint32Array(config.length);
    crypto.getRandomValues(array);
    for (let i = 0; i < config.length; i++) {
      result += chars.charAt(array[i] % chars.length);
    }
    return result;
  }, [config]);

  useEffect(() => {
    setPassword(generatePassword());
  }, [generatePassword]);

  const handleStrengthChange = (strength: PasswordGeneratorConfig['strength']) => {
    const strengthConf = STRENGTH_CONFIG[strength];
    setConfig({
      ...config,
      strength,
      length: strengthConf.length,
      uppercase: strengthConf.uppercase,
      lowercase: strengthConf.lowercase,
      numbers: strengthConf.numbers,
      symbols: strengthConf.symbols,
    });
  };

  const handleRefresh = () => {
    setPassword(generatePassword());
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleApply = () => {
    onApply(password);
    onClose();
  };

  return (
    <div className="password-generator-overlay">
      <div className="password-generator-modal">
        <div className="modal-header">
          <h3>密码生成器</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="generated-password-display">
          <input
            type="text"
            value={password}
            readOnly
            className="generated-password-input"
          />
          <div className="password-actions">
            <button onClick={handleRefresh} title="重新生成">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
            <button onClick={handleCopy} title="复制">
              {copied ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="password-options">
          <div className="option-group">
            <label>密码长度: {config.length}</label>
            <input
              type="range"
              min="6"
              max="64"
              value={config.length}
              onChange={(e) => setConfig({ ...config, length: parseInt(e.target.value) })}
            />
          </div>

          <div className="option-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.uppercase}
                onChange={(e) => setConfig({ ...config, uppercase: e.target.checked })}
              />
              <span>大写字母 (A-Z)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.lowercase}
                onChange={(e) => setConfig({ ...config, lowercase: e.target.checked })}
              />
              <span>小写字母 (a-z)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.numbers}
                onChange={(e) => setConfig({ ...config, numbers: e.target.checked })}
              />
              <span>数字 (0-9)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.symbols}
                onChange={(e) => setConfig({ ...config, symbols: e.target.checked })}
              />
              <span>特殊符号 (!@#$...)</span>
            </label>
          </div>

          <div className="option-group">
            <label>密码强度</label>
            <div className="strength-buttons">
              <button
                className={`strength-btn ${config.strength === 'weak' ? 'active' : ''}`}
                onClick={() => handleStrengthChange('weak')}
              >
                弱
              </button>
              <button
                className={`strength-btn ${config.strength === 'medium' ? 'active' : ''}`}
                onClick={() => handleStrengthChange('medium')}
              >
                中
              </button>
              <button
                className={`strength-btn ${config.strength === 'strong' ? 'active' : ''}`}
                onClick={() => handleStrengthChange('strong')}
              >
                强
              </button>
              <button
                className={`strength-btn ${config.strength === 'very-strong' ? 'active' : ''}`}
                onClick={() => handleStrengthChange('very-strong')}
              >
                极强
              </button>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleApply}>应用密码</button>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;
