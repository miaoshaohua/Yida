import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';

interface PermissionConfig {
  module: string;
  label: string;
  actions: { action: string; label: string }[];
}

const MODULES: PermissionConfig[] = [
  {
    module: 'USERS',
    label: '用户管理',
    actions: [
      { action: 'READ', label: '查看' },
      { action: 'CREATE', label: '新增' },
      { action: 'UPDATE', label: '编辑' },
      { action: 'DELETE', label: '删除' },
    ],
  },
  {
    module: 'ORDERS',
    label: '订单管理',
    actions: [
      { action: 'READ', label: '查看' },
      { action: 'UPDATE', label: '退款' },
    ],
  },
  {
    module: 'TRYON',
    label: '试衣记录',
    actions: [
      { action: 'READ', label: '查看' },
      { action: 'DELETE', label: '删除' },
    ],
  },
  {
    module: 'PHOTOS',
    label: '照片管理',
    actions: [
      { action: 'READ', label: '查看' },
      { action: 'DELETE', label: '删除' },
    ],
  },
  {
    module: 'ADMINS',
    label: '管理员管理',
    actions: [
      { action: 'READ', label: '查看' },
      { action: 'CREATE', label: '新增' },
      { action: 'UPDATE', label: '编辑' },
      { action: 'DELETE', label: '删除' },
    ],
  },
  {
    module: 'LOGS',
    label: '日志管理',
    actions: [{ action: 'READ', label: '查看' }],
  },
];

interface PermissionModalProps {
  adminId: string;
  adminName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ adminId, adminName, onClose, onSuccess }) => {
  const [permissions, setPermissions] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const data = await adminApi.get(`/admins/${adminId}/permissions`);
        const perms: { [key: string]: string[] } = {};
        for (const p of data.data) {
          perms[p.module] = p.actions;
        }
        setPermissions(perms);
      } catch (err) {
        console.error('获取权限失败', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, [adminId]);

  const toggleAction = (module: string, action: string) => {
    setPermissions((prev) => {
      const moduleActions = prev[module] || [];
      if (moduleActions.includes(action)) {
        return { ...prev, [module]: moduleActions.filter((a) => a !== action) };
      } else {
        return { ...prev, [module]: [...moduleActions, action] };
      }
    });
  };

  const toggleModule = (module: string, actions: string[]) => {
    setPermissions((prev) => {
      const currentActions = prev[module] || [];
      const allSelected = actions.every((a) => currentActions.includes(a));
      if (allSelected) {
        const newPerms = { ...prev };
        delete newPerms[module];
        return newPerms;
      } else {
        return { ...prev, [module]: actions };
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const permissionsArray = Object.entries(permissions)
        .filter(([, actions]) => actions.length > 0)
        .map(([module, actions]) => ({ module, actions }));

      await adminApi.put(`/admins/${adminId}/permissions`, { permissions: permissionsArray });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || '保存权限失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>配置权限 - {adminName}</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={styles.content}>
          {loading ? (
            <p style={styles.loading}>加载中...</p>
          ) : (
            <div style={styles.moduleList}>
              {MODULES.map((mod) => {
                const moduleActions = permissions[mod.module] || [];
                const allSelected = mod.actions.every((a) => moduleActions.includes(a.action));
                const someSelected = moduleActions.length > 0 && !allSelected;

                return (
                  <div key={mod.module} style={styles.moduleCard}>
                    <div style={styles.moduleHeader}>
                      <label style={styles.moduleLabel}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected;
                          }}
                          onChange={() => toggleModule(mod.module, mod.actions.map((a) => a.action))}
                          style={styles.checkbox}
                        />
                        <span style={styles.moduleName}>{mod.label}</span>
                      </label>
                    </div>
                    <div style={styles.actionList}>
                      {mod.actions.map((action) => (
                        <label key={action.action} style={styles.actionLabel}>
                          <input
                            type="checkbox"
                            checked={moduleActions.includes(action.action)}
                            onChange={() => toggleAction(mod.module, action.action)}
                            style={styles.checkbox}
                          />
                          {action.label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>取消</button>
          <button style={styles.saveBtn} onClick={handleSave} disabled={saving || loading}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    width: '600px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #f0f0f0',
  },
  title: { fontSize: '18px', fontWeight: 600, margin: 0 },
  closeBtn: { border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' },
  content: { padding: '24px' },
  loading: { textAlign: 'center', color: '#999' },
  moduleList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  moduleCard: { border: '1px solid #e8e8e8', borderRadius: '8px', padding: '16px' },
  moduleHeader: { marginBottom: '12px' },
  moduleLabel: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 },
  moduleName: { fontSize: '15px' },
  actionList: { display: 'flex', gap: '16px', paddingLeft: '24px', flexWrap: 'wrap' },
  actionLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' },
  checkbox: { width: '16px', height: '16px', cursor: 'pointer' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid #f0f0f0' },
  cancelBtn: { padding: '8px 16px', border: '1px solid #d9d9d9', borderRadius: '6px', background: 'white', cursor: 'pointer' },
  saveBtn: { padding: '8px 16px', border: 'none', borderRadius: '6px', background: '#E6004C', color: 'white', cursor: 'pointer' },
};
