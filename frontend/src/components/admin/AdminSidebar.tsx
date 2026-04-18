import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin } = useAdminAuth();

  const menuItems = [
    { path: '/admin/dashboard', icon: '📊', label: '仪表板' },
    { path: '/admin/users', icon: '👥', label: '用户管理' },
    { path: '/admin/orders', icon: '📦', label: '订单管理' },
    { path: '/admin/tryon', icon: '👗', label: '试衣记录' },
    { path: '/admin/photos', icon: '🖼️', label: '照片管理' },
    { path: '/admin/accounts', icon: '🔑', label: '管理员账号' },
    { path: '/admin/logs', icon: '📝', label: '操作日志' },
    { path: '/admin/api-logs', icon: '🔗', label: 'API 日志' },
    ...(admin?.role === 'SUPER_ADMIN' ? [{ path: '/admin/configs', icon: '⚙️', label: '系统配置' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoSection}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>👗</span>
          <span style={styles.logoText}>Yida Admin</span>
        </div>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <button
            key={item.path}
            style={{ ...styles.navItem, ...(isActive(item.path) ? styles.active : {}) }}
            onClick={() => navigate(item.path)}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span style={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      {admin && (
        <div style={styles.adminInfo}>
          <div style={styles.adminAvatar}>
            {admin.username.charAt(0).toUpperCase()}
          </div>
          <div style={styles.adminDetails}>
            <div style={styles.adminName}>{admin.username}</div>
            <div style={styles.adminRole}>
              {admin.role === 'SUPER_ADMIN' ? '超级管理员' : '管理员'}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: '260px',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    minHeight: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    color: 'white',
  },
  logoSection: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '32px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 700,
  },
  nav: {
    flex: 1,
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    textAlign: 'left',
  },
  active: {
    background: 'rgba(230, 0, 76, 0.2)',
    color: '#E6004C',
  },
  navIcon: {
    fontSize: '20px',
  },
  navLabel: {
    flex: 1,
  },
  adminInfo: {
    padding: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  adminAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 600,
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '2px',
  },
  adminRole: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
};
