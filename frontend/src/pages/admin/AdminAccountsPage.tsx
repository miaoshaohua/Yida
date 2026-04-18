import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminAdminsAPI, Admin } from '../../services/adminApi';

export const AdminAccountsPage: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', role: 'ADMIN' });
  const [editForm, setEditForm] = useState({ email: '', password: '', role: 'ADMIN', status: 'ACTIVE' });

  const pageSize = 20;

  const fetchAdmins = async (currentPage: number = 1, searchQuery: string = '') => {
    try {
      setLoading(true);
      setError('');
      const data = await adminAdminsAPI.getAdmins(currentPage, pageSize, searchQuery);
      setAdmins(data.admins);
      setTotal(data.total);
      setPage(currentPage);
      setSearch(searchQuery);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取管理员列表失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdmins(1, searchInput);
  };

  const handleCreate = async () => {
    if (!createForm.username || !createForm.password) {
      alert('请填写用户名和密码');
      return;
    }

    try {
      await adminAdminsAPI.createAdmin(createForm);
      setShowCreateModal(false);
      setCreateForm({ username: '', email: '', password: '', role: 'ADMIN' });
      fetchAdmins(page, search);
    } catch (err: any) {
      alert(err.response?.data?.message || '创建失败');
    }
  };

  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setEditForm({
      email: admin.email || '',
      password: '',
      role: admin.role,
      status: admin.status,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAdmin) return;

    try {
      await adminAdminsAPI.updateAdmin(selectedAdmin.id, editForm);
      setShowEditModal(false);
      fetchAdmins(page, search);
    } catch (err: any) {
      alert(err.response?.data?.message || '保存失败');
    }
  };

  const handleDelete = async (adminId: string, username: string) => {
    if (!confirm(`确定要删除管理员账号 "${username}" 吗？此操作不可恢复！`)) {
      return;
    }
    try {
      await adminAdminsAPI.deleteAdmin(adminId);
      fetchAdmins(page, search);
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败');
    }
  };



  const getRoleBadge = (role: string) => {
    if (role === 'SUPER_ADMIN') {
      return { text: '超级管理员', style: { background: '#fff1f0', color: '#ff4d4f' } };
    }
    return { text: '管理员', style: { background: '#e6f7ff', color: '#1890ff' } };
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') {
      return { text: '正常', style: { background: '#f6ffed', color: '#52c41a' } };
    }
    return { text: '禁用', style: { background: '#fff1f0', color: '#ff4d4f' } };
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AdminLayout>
      <div>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>管理员账号管理</h1>
          <div style={styles.headerActions}>
            <form style={styles.searchForm} onSubmit={handleSearch}>
              <input
                type="text"
                style={styles.searchInput}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜索用户名或邮箱"
              />
              <button type="submit" style={styles.searchButton}>🔍 搜索</button>
              {search && (
                <button type="button" style={styles.clearButton} onClick={() => fetchAdmins(1, '')}>
                  清除
                </button>
              )}
            </form>
            <button style={styles.createButton} onClick={() => setShowCreateModal(true)}>
              + 新增管理员
            </button>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>加载中...</p>
          </div>
        ) : (
          <>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>用户名</th>
                    <th style={styles.th}>邮箱</th>
                    <th style={styles.th}>角色</th>
                    <th style={styles.th}>状态</th>
                    <th style={styles.th}>登录次数</th>
                    <th style={styles.th}>最后登录</th>
                    <th style={styles.th}>创建时间</th>
                    <th style={styles.th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => {
                    const roleBadge = getRoleBadge(admin.role);
                    const statusBadge = getStatusBadge(admin.status);
                    return (
                      <tr key={admin.id} style={styles.tableRow}>
                        <td style={styles.td}>
                          <div style={styles.userInfo}>
                            <div style={styles.avatar}>{admin.username.charAt(0).toUpperCase()}</div>
                            <span style={styles.userName}>{admin.username}</span>
                          </div>
                        </td>
                        <td style={styles.td}>{admin.email || '-'}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, ...roleBadge.style }}>{roleBadge.text}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, ...statusBadge.style }}>{statusBadge.text}</span>
                        </td>
                        <td style={styles.td}>{admin.loginCount}</td>
                        <td style={styles.td}>
                          {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString('zh-CN') : '-'}
                        </td>
                        <td style={styles.td}>{new Date(admin.createdAt).toLocaleString('zh-CN')}</td>
                        <td style={styles.td}>
                          <div style={styles.actionButtons}>
                            <button style={styles.actionButton} onClick={() => handleEdit(admin)}>
                              编辑
                            </button>
                            {admin.role !== 'SUPER_ADMIN' && (
                              <button style={styles.actionButtonDanger} onClick={() => handleDelete(admin.id, admin.username)}>
                                删除
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {admins.length === 0 && (
              <div style={styles.emptyContainer}>
                <div style={styles.emptyIcon}>👤</div>
                <p style={styles.emptyText}>暂无管理员账号</p>
              </div>
            )}

            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button style={styles.paginationButton} disabled={page <= 1} onClick={() => fetchAdmins(page - 1, search)}>
                  上一页
                </button>
                <span style={styles.paginationInfo}>
                  第 {page} 页 / 共 {totalPages} 页 ({total} 条)
                </span>
                <button style={styles.paginationButton} disabled={page >= totalPages} onClick={() => fetchAdmins(page + 1, search)}>
                  下一页
                </button>
              </div>
            )}
          </>
        )}

        {showCreateModal && (
          <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>新增管理员</h2>
                <button style={styles.closeButton} onClick={() => setShowCreateModal(false)}>✕</button>
              </div>
              <div style={styles.modalContent}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>用户名 *</label>
                  <input
                    type="text"
                    style={styles.formInput}
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="至少3个字符"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>邮箱</label>
                  <input
                    type="text"
                    style={styles.formInput}
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>密码 *</label>
                  <input
                    type="password"
                    style={styles.formInput}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="至少6个字符"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>角色</label>
                  <select
                    style={styles.formSelect}
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  >
                    <option value="ADMIN">管理员</option>
                    <option value="SUPER_ADMIN">超级管理员</option>
                  </select>
                </div>
                <div style={styles.modalFooter}>
                  <button style={styles.cancelButton} onClick={() => setShowCreateModal(false)}>
                    取消
                  </button>
                  <button style={styles.saveButton} onClick={handleCreate}>
                    创建
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditModal && selectedAdmin && (
          <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>编辑管理员</h2>
                <button style={styles.closeButton} onClick={() => setShowEditModal(false)}>✕</button>
              </div>
              <div style={styles.modalContent}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>用户名</label>
                  <input type="text" style={styles.formInputDisabled} value={selectedAdmin.username} disabled />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>邮箱</label>
                  <input
                    type="text"
                    style={styles.formInput}
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>新密码（留空则不修改）</label>
                  <input
                    type="password"
                    style={styles.formInput}
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="至少6个字符"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>角色</label>
                  <select
                    style={styles.formSelect}
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="ADMIN">管理员</option>
                    <option value="SUPER_ADMIN">超级管理员</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>状态</label>
                  <select
                    style={styles.formSelect}
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">正常</option>
                    <option value="DISABLED">禁用</option>
                  </select>
                </div>
                <div style={styles.modalFooter}>
                  <button style={styles.cancelButton} onClick={() => setShowEditModal(false)}>
                    取消
                  </button>
                  <button style={styles.saveButton} onClick={handleSaveEdit}>
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#333',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchForm: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  searchInput: {
    padding: '8px 16px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    width: '240px',
  },
  searchButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
  },
  clearButton: {
    padding: '8px 16px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    background: 'white',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
  },
  createButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
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
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    background: '#fafafa',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    borderBottom: '1px solid #f0f0f0',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#666',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 600,
    fontSize: '14px',
  },
  userName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    background: '#e6f7ff',
    color: '#1890ff',
    fontSize: '13px',
    cursor: 'pointer',
  },
  actionButtonDanger: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    background: '#fff1f0',
    color: '#ff4d4f',
    fontSize: '13px',
    cursor: 'pointer',
  },
  emptyContainer: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#999',
    margin: 0,
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '24px',
  },
  paginationButton: {
    padding: '8px 16px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    background: 'white',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
  },
  paginationInfo: {
    fontSize: '14px',
    color: '#666',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #f0f0f0',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#333',
    margin: 0,
  },
  closeButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '50%',
    background: '#f5f5f5',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '8px',
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  formInputDisabled: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    background: '#f5f5f5',
    color: '#999',
  },
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    background: 'white',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    background: 'white',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
