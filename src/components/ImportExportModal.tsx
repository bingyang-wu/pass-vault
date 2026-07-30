import React, { useState, useRef } from 'react';
import { ExportData, PasswordEntry } from '../types';
import { encryptWithKey, decryptWithKey } from '../utils/crypto';

interface ImportExportModalProps {
  entries: PasswordEntry[];
  onImport: (entries: PasswordEntry[]) => void;
  onClose: () => void;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  entries,
  onImport,
  onClose,
}) => {
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [importData, setImportData] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (!encryptionKey.trim()) {
      setError('请输入加密密钥');
      return;
    }

    if (encryptionKey.length < 4) {
      setError('密钥长度至少为4位');
      return;
    }

    try {
      const exportData: ExportData = {
        version: '1.0',
        entries: entries,
        exportedAt: Date.now(),
      };

      const jsonData = JSON.stringify(exportData, null, 2);
      const encrypted = encryptWithKey(jsonData, encryptionKey);

      // 创建下载
      const blob = new Blob([encrypted], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `passvault-export-${Date.now()}.pvault`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('导出成功！文件已下载');
      setError('');
    } catch (err) {
      setError('导出失败：' + (err as Error).message);
    }
  };

  const handleImport = () => {
    if (!encryptionKey.trim()) {
      setError('请输入解密密钥');
      return;
    }

    if (!importData.trim()) {
      setError('请选择或粘贴要导入的数据');
      return;
    }

    try {
      const decrypted = decryptWithKey(importData.trim(), encryptionKey);
      const data: ExportData = JSON.parse(decrypted);

      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('无效的数据格式');
      }

      // 验证导入的数据结构
      const validEntries = data.entries.filter(
        (entry) =>
          entry.id &&
          entry.websiteName &&
          Array.isArray(entry.accounts)
      );

      if (validEntries.length === 0) {
        throw new Error('没有找到有效的密码条目');
      }

      onImport(validEntries as PasswordEntry[]);
      setSuccess(`成功导入 ${validEntries.length} 条记录`);
      setError('');
    } catch (err) {
      setError('导入失败：' + (err as Error).message);
      setSuccess('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);
      setError('');
    };
    reader.onerror = () => {
      setError('文件读取失败');
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="import-export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>导入 / 导出</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${mode === 'export' ? 'active' : ''}`}
            onClick={() => {
              setMode('export');
              setError('');
              setSuccess('');
            }}
          >
            导出数据
          </button>
          <button
            className={`tab-btn ${mode === 'import' ? 'active' : ''}`}
            onClick={() => {
              setMode('import');
              setError('');
              setSuccess('');
            }}
          >
            导入数据
          </button>
        </div>

        <div className="modal-body">
          {mode === 'export' ? (
            <div className="export-panel">
              <p className="info-text">
                共有 <strong>{entries.length}</strong> 条密码记录
              </p>
              <p className="warning-text">
                导出数据将使用您设置的密钥加密，请务必牢记密钥！
              </p>
              <div className="form-group">
                <label>设置加密密钥</label>
                <input
                  type="password"
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  placeholder="输入至少4位的加密密钥"
                />
              </div>
              <button className="btn-primary export-btn" onClick={handleExport}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                导出并下载
              </button>
            </div>
          ) : (
            <div className="import-panel">
              <div className="form-group">
                <label>解密密钥</label>
                <input
                  type="password"
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  placeholder="输入导出时使用的密钥"
                />
              </div>
              <div className="form-group">
                <label>数据文件</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pvault,.txt"
                  style={{ display: 'none' }}
                />
                <button
                  className="btn-secondary file-select-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  选择文件
                </button>
              </div>
              <div className="form-group">
                <label>或粘贴加密数据</label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="粘贴导出的加密数据..."
                  rows={6}
                />
              </div>
              <button className="btn-primary import-btn" onClick={handleImport}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                解密并导入
              </button>
            </div>
          )}

          {error && <div className="message error-message">{error}</div>}
          {success && <div className="message success-message">{success}</div>}
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;
