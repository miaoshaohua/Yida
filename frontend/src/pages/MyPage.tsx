import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleMenuClick = (label: string) => {
    alert(`${label}功能开发中，敬请期待！`);
  };

  const handleUpgrade = () => {
    alert('会员功能开发中，敬请期待！');
  };

  const menuItems = [
    { icon: '📊', label: '试衣统计', action: () => handleMenuClick('试衣统计') },
    { icon: '👤', label: '账号安全', action: () => handleMenuClick('账号安全') },
    { icon: '⚙️', label: '设置', action: () => handleMenuClick('设置') },
    { icon: '❓', label: '帮助与反馈', action: () => handleMenuClick('帮助与反馈') },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  const displayName = user?.nickname || (user?.phone ? `用户${user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}` : '游客用户');
  const remainingCount = user?.isMember ? '∞' : Math.max(0, 3 - (user?.dailyTryOnCount || 0));

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>
            👤
          </div>
          <h2 style={styles.userName}>{displayName}</h2>
          <p style={styles.userStatus}>
            {user?.isMember ? 'VIP会员' : '免费用户'} · 剩余{remainingCount}次/天
          </p>
        </div>

        <div style={styles.content}>
          <button style={styles.upgradeButton} onClick={handleUpgrade}>
            💎 立即升级会员
          </button>

          <div style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <div 
                key={index} 
                style={styles.menuItem}
                onClick={item.action}
              >
                <span style={styles.menuIcon}>{item.icon}</span>
                <span style={styles.menuLabel}>{item.label}</span>
                <span style={styles.menuArrow}>›</span>
              </div>
            ))}
          </div>

          <button 
            style={styles.logoutButton}
            onClick={handleLogout}
          >
            退出登录
          </button>
        </div>
      </div>

      <div style={styles.bottomNav}>
        <div style={styles.navContainer}>
          <button 
            style={styles.navItem}
            onClick={() => navigate('/')}
          >
            <span style={styles.navIcon}>🏠</span>
            <span style={styles.navLabel}>首页</span>
          </button>
          <button 
            style={styles.navItem}
            onClick={() => navigate('/history')}
          >
            <span style={styles.navIcon}>📜</span>
            <span style={styles.navLabel}>历史</span>
          </button>
          <button 
            style={{ ...styles.navItem, ...styles.activeNavItem }}
          >
            <span style={styles.navIcon}>👤</span>
            <span style={styles.navLabel}>我的</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #FFF5F8 0%, #FFE8EF 100%)',
    padding: '24px 20px 100px',
  },
  container: {
    maxWidth: '450px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
  profileHeader: {
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    padding: '32px 24px',
    textAlign: 'center',
    color: 'white',
  },
  avatar: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.3)',
    margin: '0 auto 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
  },
  userName: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 4px 0',
    color: 'white',
  },
  userStatus: {
    fontSize: '14px',
    margin: 0,
    opacity: 0.9,
  },
  content: {
    padding: '24px',
  },
  upgradeButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #FF6B8A 0%, #FF9A9E 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255, 107, 138, 0.3)',
    marginBottom: '24px',
  },
  menuSection: {
    marginBottom: '24px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    background: '#fafafa',
    borderRadius: '16px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: '#f0f0f0',
    },
  },
  menuIcon: {
    fontSize: '22px',
    marginRight: '12px',
  },
  menuLabel: {
    flex: 1,
    fontSize: '16px',
    color: '#333',
    fontWeight: 500,
  },
  menuArrow: {
    fontSize: '24px',
    color: '#ccc',
  },
  logoutButton: {
    width: '100%',
    padding: '14px',
    background: 'transparent',
    color: '#E6004C',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: '#FFF5F8',
    },
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'white',
    borderTop: '1px solid #f0f0f0',
    zIndex: 1000,
  },
  navContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '8px 0',
    maxWidth: '600px',
    margin: '0 auto',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#999',
    position: 'relative',
  },
  activeNavItem: {
    color: '#E6004C',
    '&::after': {
      content: '',
      position: 'absolute',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '30px',
      height: '3px',
      background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
      borderRadius: '0 0 3px 3px',
    },
  },
  navIcon: {
    fontSize: '24px',
    marginBottom: '4px',
  },
  navLabel: {
    fontSize: '12px',
    fontWeight: 500,
  },
};
