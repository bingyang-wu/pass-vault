import React, { useState } from 'react';

interface AuthScreenProps {
  isFirstTime: boolean;
  onSetPassword: (password: string) => void;
  onUnlock: (password: string) => boolean;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ isFirstTime, onSetPassword, onUnlock }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isFirstTime) {
      if (password.length < 6) {
        setError('密码长度至少为6位');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
      onSetPassword(password);
    } else {
      const success = onUnlock(password);
      if (!success) {
        setError('密码错误，请重试');
      }
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-logo">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h1>PassVault</h1>
        <p className="auth-subtitle">
          {isFirstTime ? '设置主密码以保护您的密码库' : '请输入主密码以解锁'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isFirstTime ? '设置主密码' : '输入主密码'}
              autoFocus
              className="auth-input"
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>

          {isFirstTime && (
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="确认主密码"
                className="auth-input"
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn">
            {isFirstTime ? '创建密码库' : '解锁'}
          </button>
        </form>

        {isFirstTime && (
          <p className="auth-tip">
            主密码用于加密您的所有密码，请妥善保管。如果忘记密码，将无法恢复数据。
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
