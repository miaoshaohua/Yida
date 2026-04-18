import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminTryOnAPI, TryOnRecord } from '../../services/adminApi';

export const AdminTryOnPage: React.FC = () => {
  const [records, setRecords] = useState<TryOnRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<TryOnRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const pageSize = 20;

  const fetchRecords = async (currentPage: number = 1) => {
    try {
      setLoading(true);
      setError('');
      const data = await adminTryOnAPI.getRecords(currentPage, pageSize);
      setRecords(data.records);
      setTotal(data.total);
      setPage(currentPage);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取试衣记录失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (recordId: string) => {
    if (!confirm('确定要删除这条试衣记录吗？')) {
      return;
    }

    try {
      await adminTryOnAPI.deleteRecord(recordId);
      fetchRecords(page);
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      alert('请先选择要删除的记录');
      return;
    }
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 条试衣记录吗？`)) {
      return;
    }

    try {
      await adminTryOnAPI.batchDeleteRecords(selectedIds);
      setSelectedIds([]);
      fetchRecords(page);
    } catch (err: any) {
      alert(err.response?.data?.message || '批量删除失败');
    }
  };

  const toggleSelect = (recordId: string) => {
    if (selectedIds.includes(recordId)) {
      setSelectedIds(selectedIds.filter(id => id !== recordId));
    } else {
      setSelectedIds([...selectedIds, recordId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map(r => r.id));
    }
  };

  const handleViewDetail = async (recordId: string) => {
    try {
      const data = await adminTryOnAPI.getRecordDetail(recordId);
      setSelectedRecord(data);
      setShowDetail(true);
    } catch (err: any) {
      alert(err.response?.data?.message || '获取详情失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; style: React.CSSProperties } } = {
      pending: { text: '排队中', style: { background: '#fff7e6', color: '#fa8c16' } },
      processing: { text: '处理中', style: { background: '#e6f7ff', color: '#1890ff' } },
      completed: { text: '已完成', style: { background: '#f6ffed', color: '#52c41a' } },
      failed: { text: '失败', style: { background: '#fff1f0', color: '#ff4d4f' } },
    };
    return statusMap[status] || { text: status, style: { background: '#f5f5f5', color: '#666' } };
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AdminLayout>
      <div>
        <h1 style={styles.pageTitle}>试衣记录</h1>

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
              <div style={styles.tableHeaderActions}>
                <button
                  style={selectedIds.length > 0 ? styles.batchButtonDanger : styles.batchButtonDisabled}
                  disabled={selectedIds.length === 0}
                  onClick={handleBatchDelete}
                >
                  批量删除 ({selectedIds.length})
                </button>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={{ ...styles.th, width: '50px' }}>
                      <input
                        type="checkbox"
                        checked={records.length > 0 && selectedIds.length === records.length}
                        onChange={toggleSelectAll}
                        style={styles.checkbox}
                      />
                    </th>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>用户</th>
                    <th style={styles.th}>状态</th>
                    <th style={styles.th}>创建时间</th>
                    <th style={styles.th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const statusBadge = getStatusBadge(record.status);
                    return (
                      <tr key={record.id} style={styles.tableRow}>
                        <td style={{ ...styles.td, width: '50px' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(record.id)}
                            onChange={() => toggleSelect(record.id)}
                            style={styles.checkbox}
                          />
                        </td>
                        <td style={styles.td}>{record.id.slice(0, 8)}...</td>
                        <td style={styles.td}>
                          {record.user?.nickname || record.user?.phone || '未知用户'}
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.statusBadge, ...statusBadge.style }}>
                            {statusBadge.text}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {new Date(record.createdAt).toLocaleString('zh-CN')}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionButtons}>
                            <button
                              style={styles.actionButton}
                              onClick={() => handleViewDetail(record.id)}
                            >
                              查看
                            </button>
                            <button
                              style={styles.actionButtonDanger}
                              onClick={() => handleDelete(record.id)}
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

            {records.length === 0 && (
              <div style={styles.emptyContainer}>
                <div style={styles.emptyIcon}>👗</div>
                <p style={styles.emptyText}>暂无试衣记录</p>
              </div>
            )}

            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  style={styles.paginationButton}
                  disabled={page <= 1}
                  onClick={() => fetchRecords(page - 1)}
                >
                  上一页
                </button>
                <span style={styles.paginationInfo}>
                  第 {page} 页 / 共 {totalPages} 页 ({total} 条)
                </span>
                <button
                  style={styles.paginationButton}
                  disabled={page >= totalPages}
                  onClick={() => fetchRecords(page + 1)}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}

        {showDetail && selectedRecord && (
          <div style={styles.modalOverlay} onClick={() => setShowDetail(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>试衣记录详情</h2>
                <button style={styles.closeButton} onClick={() => setShowDetail(false)}>
                  ✕
                </button>
              </div>
              <div style={styles.modalContent}>
                <div style={styles.detailImages}>
                  <div style={styles.detailImage}>
                    <div style={styles.imageLabel}>人物照片</div>
                    <img src={selectedRecord.personImageUrl} alt="人物" style={styles.image} />
                  </div>
                  <div style={styles.detailImage}>
                    <div style={styles.imageLabel}>衣服照片</div>
                    <img src={selectedRecord.clothImageUrl} alt="衣服" style={styles.image} />
                  </div>
                  {selectedRecord.resultImageUrl && (
                    <div style={styles.detailImage}>
                      <div style={styles.imageLabel}>试衣结果</div>
                      <img src={selectedRecord.resultImageUrl} alt="结果" style={styles.image} />
                    </div>
                  )}
                </div>
                <div style={styles.detailInfo}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>状态：</span>
                    <span style={{
                      ...styles.statusBadge,
                      ...getStatusBadge(selectedRecord.status).style,
                    }}>
                      {getStatusBadge(selectedRecord.status).text}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>创建时间：</span>
                    <span style={styles.infoValue}>
                      {new Date(selectedRecord.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {selectedRecord.startedAt && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>开始时间：</span>
                      <span style={styles.infoValue}>
                        {new Date(selectedRecord.startedAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  )}
                  {selectedRecord.completedAt && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>完成时间：</span>
                      <span style={styles.infoValue}>
                        {new Date(selectedRecord.completedAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  )}
                  {selectedRecord.errorMessage && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>错误信息：</span>
                      <span style={styles.errorText}>{selectedRecord.errorMessage}</span>
                    </div>
                  )}
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
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  tableHeaderActions: {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
  },
  batchButtonDanger: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    background: '#ff4d4f',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  batchButtonDisabled: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    background: '#f5f5f5',
    color: '#999',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'not-allowed',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
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
  statusBadge: {
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
    maxWidth: '900px',
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
  detailImages: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  detailImage: {
    textAlign: 'center',
  },
  imageLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '12px',
  },
  image: {
    width: '100%',
    height: '280px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  detailInfo: {
    background: '#fafafa',
    borderRadius: '8px',
    padding: '20px',
  },
  infoRow: {
    display: 'flex',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#666',
    minWidth: '100px',
  },
  infoValue: {
    fontSize: '14px',
    color: '#333',
    fontWeight: 500,
  },
  errorText: {
    fontSize: '14px',
    color: '#ff4d4f',
  },
};
