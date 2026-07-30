import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PasswordEntry, ThemeType, EntryType } from '../types';
import { generateId } from '../utils/crypto';
import PasswordCard from './PasswordCard';
import EntryFormModal from './EntryFormModal';
import DatabaseFormModal from './DatabaseFormModal';
import EntryTypeSelector from './EntryTypeSelector';
import ImportExportModal from './ImportExportModal';
import ChangePasswordModal from './ChangePasswordModal';

interface DashboardProps {
  entries: PasswordEntry[];
  onUpdateEntries: (entries: PasswordEntry[]) => void;
  theme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  onChangePassword: (oldPassword: string, newPassword: string) => boolean;
  onLock: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  entries,
  onUpdateEntries,
  theme,
  onThemeChange,
  onChangePassword,
  onLock,
}: DashboardProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<EntryType>('website');
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // 点击设置面板外部时关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettings && settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  // 过滤条目
  const filteredEntries = entries.filter((entry) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // 搜索网站名称
    if (entry.websiteName.toLowerCase().includes(query)) return true;
    // 搜索URL
    if (entry.url.toLowerCase().includes(query)) return true;
    // 搜索标签
    if (entry.tags.some((tag) => tag.toLowerCase().includes(query))) return true;
    // 搜索环境
    if (entry.environment.toLowerCase().includes(query)) return true;
    // 搜索账号用户名
    if (
      entry.accounts.some((acc) => acc.username.toLowerCase().includes(query))
    )
      return true;

    return false;
  });

  const handleSaveEntry = (entry: PasswordEntry) => {
    const existingIndex = entries.findIndex((e) => e.id === entry.id);
    let newEntries: PasswordEntry[];

    if (existingIndex >= 0) {
      newEntries = [...entries];
      newEntries[existingIndex] = entry;
    } else {
      newEntries = [entry, ...entries];
    }

    onUpdateEntries(newEntries);
    setShowAddModal(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      onUpdateEntries(entries.filter((e) => e.id !== id));
    }
  };

  const handleEditEntry = (entry: PasswordEntry) => {
    setEditingEntry(entry);
    setAddType(entry.type || 'website');
    setShowAddModal(true);
  };

  const handleImport = (importedEntries: PasswordEntry[]) => {
    // 为导入的条目生成新ID以避免冲突，并确保 type 字段存在
    const newEntries = importedEntries.map((entry) => ({
      ...entry,
      type: entry.type || 'website' as const,
      id: generateId(),
      updatedAt: Date.now(),
    }));

    // 合并条目（基于网站名称和用户名的唯一性）
    // 只与原始已有条目做去重，避免同一批导入的条目互相覆盖
    const originalCount = entries.length;
    const mergedEntries = [...entries];
    let addedCount = 0;
    newEntries.forEach((imported) => {
      const existingIndex = mergedEntries.findIndex(
        (e, idx) =>
          idx < originalCount &&
          e.websiteName === imported.websiteName &&
          JSON.stringify(e.accounts.map((a) => a.username)) ===
            JSON.stringify(imported.accounts.map((a) => a.username))
      );
      if (existingIndex >= 0) {
        mergedEntries[existingIndex] = imported;
      } else {
        mergedEntries.push(imported);
        addedCount++;
      }
    });

    onUpdateEntries(mergedEntries);
    setShowImportExport(false);
    setCopiedNotification(`成功导入 ${importedEntries.length} 条记录（新增 ${addedCount} 条，更新 ${importedEntries.length - addedCount} 条）`);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const showNotification = useCallback((message: string) => {
    setCopiedNotification(message);
    setTimeout(() => setCopiedNotification(null), 2000);
  }, []);

  // 拖拽排序相关处理（仅在非搜索模式下启用）
  const isDraggable = !searchQuery;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newEntries = [...entries];
    const [draggedItem] = newEntries.splice(draggedIndex, 1);
    newEntries.splice(index, 0, draggedItem);

    onUpdateEntries(newEntries);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={`dashboard theme-${theme}`}>
      {/* 顶部导航栏 */}
      <header className="app-header">
        <div className="header-left">
          <span className="app-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            PassVault
          </span>
        </div>

        <div className="header-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索网站、URL、标签、账号..."
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              &times;
            </button>
          )}
        </div>

        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => setShowImportExport(true)}
            title="导入/导出"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="设置"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button
            className="icon-btn lock-btn"
            onClick={onLock}
            title="锁定 (4小时无操作自动锁定)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </button>
        </div>
      </header>

      {/* 设置面板 */}
      {showSettings && (
        <div className="settings-panel" ref={settingsRef} onClick={(e) => e.stopPropagation()}>
          <div className="settings-group">
            <div className="settings-item">
              <label>主题</label>
              <div className="theme-selector">
                <button
                  className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => onThemeChange('light')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                  浅色
                </button>
                <button
                  className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => onThemeChange('dark')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                  深色
                </button>
                <button
                  className={`theme-option ${theme === 'auto' ? 'active' : ''}`}
                  onClick={() => onThemeChange('auto')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  跟随系统
                </button>
              </div>
            </div>
          </div>
          <div className="settings-divider"></div>
          <div className="settings-group">
            <button className="settings-btn" onClick={() => setShowChangePassword(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              修改主密码
            </button>
          </div>
        </div>
      )}

      {/* 内容区域 */}
      <main className="app-content">
        {/* 统计信息 */}
        <div className="stats-bar">
          <span>共 {entries.length} 条记录</span>
          {searchQuery && (
            <span>，匹配 {filteredEntries.length} 条</span>
          )}
        </div>

        {/* 密码卡片列表 */}
        {filteredEntries.length > 0 ? (
          <div className="password-grid">
            {filteredEntries.map((entry, index) => (
              <PasswordCard
                key={entry.id}
                entry={entry}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
                onCopyPassword={() => showNotification('密码已复制到剪贴板')}
                onCopyUsername={() => showNotification('用户名已复制到剪贴板')}
                draggable={isDraggable}
                isDragging={draggedIndex === index}
                isDragOver={dragOverIndex === index}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <p>没有找到匹配的记录</p>
                <p className="empty-hint">试试其他搜索关键词</p>
              </>
            ) : (
              <>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <p>还没有保存任何密码</p>
                <p className="empty-hint">点击下方按钮添加第一条记录</p>
              </>
            )}
          </div>
        )}
      </main>

      {/* 添加按钮 */}
      <button
        className="fab-btn"
        onClick={() => {
          setEditingEntry(null);
          setShowTypeSelector(true);
        }}
        title="添加"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* 通知 */}
      {copiedNotification && (
        <div className="notification">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {copiedNotification}
        </div>
      )}

      {/* 类型选择弹框 */}
      {showTypeSelector && (
        <EntryTypeSelector
          onSelect={(type) => {
            setAddType(type);
            setShowTypeSelector(false);
            setShowAddModal(true);
          }}
          onClose={() => setShowTypeSelector(false)}
        />
      )}

      {/* 模态窗口 */}
      {showAddModal && addType === 'website' && (
        <EntryFormModal
          entry={editingEntry}
          onSave={handleSaveEntry}
          onClose={() => {
            setShowAddModal(false);
            setEditingEntry(null);
          }}
        />
      )}

      {showAddModal && addType === 'database' && (
        <DatabaseFormModal
          entry={editingEntry}
          onSave={handleSaveEntry}
          onClose={() => {
            setShowAddModal(false);
            setEditingEntry(null);
          }}
        />
      )}

      {showImportExport && (
        <ImportExportModal
          entries={entries}
          onImport={handleImport}
          onClose={() => setShowImportExport(false)}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal
          onChangePassword={onChangePassword}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
