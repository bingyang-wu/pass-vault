import React from 'react';
import { EntryType } from '../types';

interface EntryTypeSelectorProps {
  onSelect: (type: EntryType) => void;
  onClose: () => void;
}

const EntryTypeSelector: React.FC<EntryTypeSelectorProps> = ({ onSelect, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="entry-type-selector" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>选择类型</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="type-selector-body">
          <div className="type-option" onClick={() => onSelect('website')}>
            <div className="type-icon website-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
            <div className="type-info">
              <h4>网站密码</h4>
              <p>保存网站账号密码，支持多账号</p>
            </div>
          </div>
          <div className="type-option" onClick={() => onSelect('database')}>
            <div className="type-icon database-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
              </svg>
            </div>
            <div className="type-info">
              <h4>数据库连接</h4>
              <p>保存数据库连接信息，支持多种数据库</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryTypeSelector;
