import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.logo} onClick={() => navigate('/')}>
          <span style={styles.logoIcon}>👗</span>
          <span style={styles.logoText}>Yida试衣</span>
        </div>
        <nav style={styles.nav}>
          <button
            style={{ ...styles.navButton, ...(isActive('/') ? styles.active : {}) }}
            onClick={() => navigate('/')}
          >
            首页
          </button>
          <button
            style={{ ...styles.navButton, ...(isActive('/tryon') ? styles.active : {}) }}
            onClick={() => navigate('/tryon')}
          >
            开始试衣
          </button>
          <button
            style={{ ...styles.navButton, ...(isActive('/history') ? styles.active : {}) }}
            onClick={() => navigate('/history')}
          >
            历史记录
          </button>
          <button
            style={{ ...styles.navButton, ...(isActive('/my') ? styles.active : {}) }}
            onClick={() => navigate('/my')}
          >
            我的
          </button>
        </nav>
        {user && (
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.nickname || user.phone || '游客'}</span>
          </div>
        )}
      </div>
    </header>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    boxShadow: '0 2px 8px rgba(230, 0, 76, 0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  logoIcon: {
    fontSize: '28px',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'white',
  },
  nav: {
    display: 'flex',
    gap: '8px',
  },
  navButton: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '20px',
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  active: {
    background: 'rgba(255, 255, 255, 0.25)',
    color: 'white',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
  },
};
