import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: '🏠', label: '首页' },
    { path: '/tryon', icon: '✨', label: '试衣' },
    { path: '/history', icon: '📜', label: '历史' },
    { path: '/my', icon: '👤', label: '我的' },
  ];

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {navItems.map((item) => (
          <button
            key={item.path}
            style={{ ...styles.navItem, ...(isActive(item.path) ? styles.active : {}) }}
            onClick={() => navigate(item.path)}
          >
            <span style={styles.icon}>{item.icon}</span>
            <span style={styles.label}>{item.label}</span>
          </button>
        ))}
      </div>
    </footer>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  footer: {
    background: 'white',
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    height: '60px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: '8px 20px',
    transition: 'all 0.3s ease',
  },
  active: {
    color: '#E6004C',
  },
  icon: {
    fontSize: '22px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
  },
};
