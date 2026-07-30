import React, { useState } from 'react';

interface ChangePasswordModalProps {
  onChangePassword: (oldPassword: string, newPassword: string) => boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  onChangePassword,
  onClose,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!oldPassword.trim()) {
      setError('请输入当前密码');
      return;
    }

    if (newPassword.length < 6) {
      setError('新密码长度至少为6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    if (oldPassword === newPassword) {
      setError('新密码不能与旧密码相同');
      return;
    }

    const result = onChangePassword(oldPassword, newPassword);
    if (result) {
      setSuccess('密码修改成功！');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
      }, 600);
    } else {
      setError('当前密码错误，请重试');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="change-password-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>修改主密码</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label>当前密码</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="输入当前主密码"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>新密码</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="输入新密码（至少6位）"
            />
          </div>

          <div className="form-group">
            <label>确认新密码</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
            />
          </div>

          <div className="form-group checkbox-form-group">
            <label className="checkbox-label visibility-toggle">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
              />
              <span>显示密码</span>
            </label>
          </div>

          {error && <div className="message error-message">{error}</div>}
          {success && <div className="message success-message">{success}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              确认修改
            </button>
          </div>
        </form>

        <div className="password-tip">
          <p>提示：修改主密码需要使用新密码重新加密所有数据，请耐心等待。</p>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
