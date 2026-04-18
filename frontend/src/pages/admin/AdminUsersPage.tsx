import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminUsersAPI, User } from '../../services/adminApi';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ nickname: '', phone: '', email: '', status: 'ACTIVE' });

  const pageSize = 20;

  const fetchUsers = async (currentPage: number = 1, searchQuery: string = '') => {
    try {
      setLoading(true);
      setError('');
      const data = await adminUsersAPI.getUsers(currentPage, pageSize, searchQuery);
      setUsers(data.users);
      setTotal(data.total);
      setPage(currentPage);
      setSearch(searchQuery);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取用户列表失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, searchInput);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      nickname: user.nickname || '',
      phone: user.phone || '',
      email: user.email || '',
      status: user.status,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    
    try {
      await adminUsersAPI.updateUser(selectedUser.id, editForm);
      setShowEditModal(false);
      fetchUsers(page, search);
    } catch (err: any) {
      alert(err.response?.data?.message || '保存失败');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('确定要删除该用户吗？此操作不可恢复！')) {
      return;
    }

    try {
      await adminUsersAPI.deleteUser(userId);
      fetchUsers(page, search);
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedUserIds.size === 0) {
      alert('请先选择要删除的用户');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedUserIds.size} 个用户吗？此操作不可恢复！`)) {
      return;
    }

    try {
      const result = await adminUsersAPI.batchDeleteUsers(Array.from(selectedUserIds));
      alert(result.message);
      setSelectedUserIds(new Set());
      fetchUsers(page, search);
    } catch (err: any) {
      alert(err.response?.data?.message || '批量删除失败');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') {
      return { text: '正常', style: { background: '#f6ffed', color: '#52c41a' } };
    }
    return { text: '已禁用', style: { background: '#fff1f0', color: '#ff4d4f' } };
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AdminLayout>
      <div>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>用户管理</h1>
          <div style={styles.headerActions}>
            {selectedUserIds.size > 0 && (
              <button
                type="button"
                style={styles.batchDeleteButton}
                onClick={handleBatchDelete}
              >
                🗑️ 批量删除 ({selectedUserIds.size})
              </button>
            )}
            <form style={styles.searchForm} onSubmit={handleSearch}>
              <input
                type="text"
                style={styles.searchInput}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜索手机号或昵称"
              />
              <button type="submit" style={styles.searchButton}>
                🔍 搜索
              </button>
              {search && (
                <button
                  type="button"
                  style={styles.clearButton}
                  onClick={() => fetchUsers(1, '')}
                >
                  清除
                </button>
              )}
            </form>
          </div>
        </div>

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
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={{ ...styles.th, width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={users.length > 0 && selectedUserIds.size === users.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={styles.th}>用户</th>
                    <th style={styles.th}>状态</th>
                    <th style={styles.th}>角色</th>
                    <th style={styles.th}>今日试衣</th>
                    <th style={styles.th}>累计试衣</th>
                    <th style={styles.th}>注册时间</th>
                    <th style={styles.th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const statusBadge = getStatusBadge(user.status);
                    return (
                      <tr key={user.id} style={styles.tableRow}>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedUserIds.has(user.id)}
                            onChange={() => toggleSelectUser(user.id)}
                          />
                        </td>
                        <td style={styles.td}>
                          <div style={styles.userInfo}>
                            <div style={styles.avatar}>
                              {user.nickname?.charAt(0) || user.phone?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div style={styles.userName}>{user.nickname || '未设置'}</div>
                              <div style={styles.userPhone}>{user.phone || '未绑定'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.statusBadge, ...statusBadge.style }}>
                            {statusBadge.text}
                          </span>
                        </td>
                        <td style={styles.td}>{user.role}</td>
                        <td style={styles.td}>{user.dailyTryOnCount}</td>
                        <td style={styles.td}>{user.totalTryOnCount}</td>
                        <td style={styles.td}>
                          {new Date(user.createdAt).toLocaleString('zh-CN')}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionButtons}>
                            <button
                              style={styles.actionButton}
                              onClick={() => handleEdit(user)}
                            >
                              编辑
                            </button>
                            <button
                              style={styles.actionButtonDanger}
                              onClick={() => handleDelete(user.id)}
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div style={styles.emptyContainer}>
                <div style={styles.emptyIcon}>👥</div>
                <p style={styles.emptyText}>暂无用户数据</p>
              </div>
            )}

            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  style={styles.paginationButton}
                  disabled={page <= 1}
                  onClick={() => fetchUsers(page - 1, search)}
                >
                  上一页
                </button>
                <span style={styles.paginationInfo}>
                  第 {page} 页 / 共 {totalPages} 页 ({total} 条)
                </span>
                <button
                  style={styles.paginationButton}
                  disabled={page >= totalPages}
                  onClick={() => fetchUsers(page + 1, search)}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}

        {showEditModal && selectedUser && (
          <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>编辑用户</h2>
                <button style={styles.closeButton} onClick={() => setShowEditModal(false)}>✕</button>
              </div>
              <div style={styles.modalContent}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>昵称</label>
                  <input
                    type="text"
                    style={styles.formInput}
                    value={editForm.nickname}
                    onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>手机号</label>
                  <input
                    type="text"
                    style={styles.formInput}
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
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
  searchForm: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  batchDeleteButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 500,
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
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 600,
  },
  userName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '2px',
  },
  userPhone: {
    fontSize: '12px',
    color: '#999',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
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
  actionButtonSuccess: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    background: '#f6ffed',
    color: '#52c41a',
    fontSize: '13px',
    cursor: 'pointer',
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
  actionButtons: {
    display: 'flex',
    gap: '8px',
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
