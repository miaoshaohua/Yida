import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminDashboardAPI, DashboardStats } from '../../services/adminApi';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminDashboardAPI.getStats();
        setStats(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || '获取数据失败');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: '总用户数',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: '#1890ff',
      bgColor: '#e6f7ff',
    },
    {
      label: '活跃用户',
      value: stats?.activeUsers || 0,
      icon: '🔥',
      color: '#fa8c16',
      bgColor: '#fff7e6',
    },
    {
      label: '总试衣次数',
      value: stats?.totalTryOns || 0,
      icon: '👗',
      color: '#52c41a',
      bgColor: '#f6ffed',
    },
    {
      label: '今日试衣',
      value: stats?.todayTryOns || 0,
      icon: '✨',
      color: '#722ed1',
      bgColor: '#f9f0ff',
    },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 style={styles.pageTitle}>仪表板</h1>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>加载中...</p>
          </div>
        ) : (
          <>
            <div style={styles.statCards}>
              {statCards.map((card, index) => (
                <div key={index} style={styles.statCard}>
                  <div style={{ ...styles.statIcon, background: card.bgColor }}>
                    <span style={{ ...styles.statIconText, color: card.color }}>
                      {card.icon}
                    </span>
                  </div>
                  <div style={styles.statContent}>
                    <div style={styles.statValue}>{card.value}</div>
                    <div style={styles.statLabel}>{card.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.chartSection}>
              <div style={styles.chartCard}>
                <h2 style={styles.chartTitle}>快速操作</h2>
                <div style={styles.quickActions}>
                  <button style={styles.quickAction} onClick={() => window.location.href = '/admin/users'}>
                    👥 管理用户
                  </button>
                  <button style={styles.quickAction} onClick={() => window.location.href = '/admin/tryon'}>
                    👗 查看试衣记录
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  pageTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 24px 0',
  },
  error: {
    background: '#fff5f5',
    border: '1px solid #ffccc7',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#ff4d4f',
    marginBottom: '24px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #E6004C',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
  },
  statCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  statIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconText: {
    fontSize: '32px',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#999',
  },
  chartSection: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px',
  },
  chartCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 20px 0',
  },
  quickActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  quickAction: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    color: 'white',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};
