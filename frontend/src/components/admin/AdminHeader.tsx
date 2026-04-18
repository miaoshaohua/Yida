import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  const handleGoToFrontend = () => {
    navigate('/');
  };

  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        <span style={styles.pageTitle}>管理后台</span>
      </div>
      <div style={styles.rightSection}>
        <button style={styles.frontendButton} onClick={handleGoToFrontend}>
          🏠 前台首页
        </button>
        <button style={styles.logoutButton} onClick={handleLogout}>
          🚪 退出登录
        </button>
      </div>
    </header>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    height: '64px',
    background: 'white',
    borderBottom: '1px solid #e8e8e8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'fixed',
    top: 0,
    left: '260px',
    right: 0,
    zIndex: 100,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  frontendButton: {
    padding: '8px 16px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    background: 'white',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  logoutButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    background: '#fff5f5',
    color: '#ff4d4f',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};
