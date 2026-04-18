import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminConfigsAPI, SystemConfig } from '../../services/adminApi';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export const AdminConfigsPage: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const { admin } = useAdminAuth();

  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';

  const fetchConfigs = async () => {
    if (!isSuperAdmin) return;
    
    try {
      setLoading(true);
      setError('');
      const data = await adminConfigsAPI.getConfigs();
      setConfigs(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取系统配置失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [isSuperAdmin]);

  const handleEdit = (config: SystemConfig) => {
    setEditingKey(config.key);
    setEditValue(config.value);
  };

  const handleSave = async (configKey: string) => {
    try {
      await adminConfigsAPI.updateConfig(configKey, editValue);
      setEditingKey(null);
      fetchConfigs();
      alert('保存成功');
    } catch (err: any) {
      alert(err.response?.data?.message || '保存失败');
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  if (!isSuperAdmin) {
    return (
      <AdminLayout>
        <div style={styles.noPermission}>
          <div style={styles.noPermissionIcon}>🔒</div>
          <h2 style={styles.noPermissionTitle}>无权限访问</h2>
          <p style={styles.noPermissionText}>只有超级管理员才能访问此页面</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <h1 style={styles.pageTitle}>系统配置</h1>

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
          <div style={styles.configsContainer}>
            {configs.map((config) => (
              <div key={config.key} style={styles.configCard}>
                <div style={styles.configHeader}>
                  <div>
                    <div style={styles.configKey}>{config.key}</div>
                    {config.description && (
                      <div style={styles.configDescription}>{config.description}</div>
                    )}
                  </div>
                  {editingKey !== config.key && (
                    <button
                      style={styles.editButton}
                      onClick={() => handleEdit(config)}
                    >
                      编辑
                    </button>
                  )}
                </div>
                {editingKey === config.key ? (
                  <div style={styles.editSection}>
                    <input
                      style={styles.editInput}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <div style={styles.editActions}>
                      <button
                        style={styles.saveButton}
                        onClick={() => handleSave(config.key)}
                      >
                        保存
                      </button>
                      <button
                        style={styles.cancelButton}
                        onClick={handleCancel}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.configValue}>{config.value}</div>
                )}
                <div style={styles.configUpdatedAt}>
                  更新时间: {new Date(config.updatedAt).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
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
  noPermission: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  noPermissionIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  noPermissionTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 12px 0',
  },
  noPermissionText: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
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
  configsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  configCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  configHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  configKey: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '4px',
  },
  configDescription: {
    fontSize: '14px',
    color: '#999',
  },
  editButton: {
    padding: '6px 16px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    background: 'white',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
  },
  configValue: {
    fontSize: '14px',
    color: '#333',
    padding: '12px 16px',
    background: '#fafafa',
    borderRadius: '8px',
    wordBreak: 'break-all',
  },
  editSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  editInput: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d9d9d9',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  editActions: {
    display: 'flex',
    gap: '12px',
  },
  saveButton: {
    padding: '8px 24px',
    border: 'none',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '8px 24px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    background: 'white',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
  },
  configUpdatedAt: {
    fontSize: '12px',
    color: '#999',
    marginTop: '12px',
  },
};
