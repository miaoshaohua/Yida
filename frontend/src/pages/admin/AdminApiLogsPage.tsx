import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApiLogsAPI, ApiLog } from '../../services/adminApi';

export const AdminApiLogsPage: React.FC = () => {
  return (
    <AdminLayout>
      <ApiLogsContent />
    </AdminLayout>
  );
};

const ApiLogsContent: React.FC = () => {
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [clothingTypeFilter, setClothingTypeFilter] = useState<string>('');
  const [statusCodeFilter, setStatusCodeFilter] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchApiLogs = async (currentPage: number, clothingType?: string, statusCode?: number) => {
    setLoading(true);
    try {
      const result = await adminApiLogsAPI.getApiLogs(currentPage, 20, clothingType, statusCode);
      setApiLogs(result.logs);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取API日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiLogs(page, clothingTypeFilter || undefined, statusCodeFilter ? parseInt(statusCodeFilter) : undefined);
  }, [page, clothingTypeFilter, statusCodeFilter]);

  const handleFilter = () => {
    setPage(1);
    fetchApiLogs(1, clothingTypeFilter || undefined, statusCodeFilter ? parseInt(statusCodeFilter) : undefined);
  };

  const handleClearFilters = () => {
    setClothingTypeFilter('');
    setStatusCodeFilter('');
    setPage(1);
    fetchApiLogs(1);
  };

  const handleViewDetail = (log: ApiLog) => {
    setSelectedLog(log);
    setShowDetail(true);
  };

  const getStatusBadge = (statusCode: number | null) => {
    if (!statusCode) return { text: '-', style: { background: '#999', color: 'white' } };
    if (statusCode >= 200 && statusCode < 300) return { text: `${statusCode}`, style: { background: '#52c41a', color: 'white' } };
    if (statusCode >= 400 && statusCode < 500) return { text: `${statusCode}`, style: { background: '#faad14', color: 'white' } };
    return { text: `${statusCode}`, style: { background: '#ff4d4f', color: 'white' } };
  };

  const getClothingTypeLabel = (type: string | null) => {
    if (!type) return '-';
    const map: Record<string, string> = {
      'TOP': '上装',
      'BOTTOM': '下装',
      'DRESS': '连衣裙',
      'OUTERWEAR': '外套',
      'FULL_BODY': '连体装',
    };
    return map[type] || type;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>API 日志</h1>
        <div style={styles.filters}>
          <select
            style={styles.filterSelect}
            value={clothingTypeFilter}
            onChange={(e) => setClothingTypeFilter(e.target.value)}
          >
            <option value="">全部类型</option>
            <option value="TOP">上装</option>
            <option value="BOTTOM">下装</option>
            <option value="DRESS">连衣裙</option>
            <option value="OUTERWEAR">外套</option>
            <option value="FULL_BODY">连体装</option>
          </select>
          <select
            style={styles.filterSelect}
            value={statusCodeFilter}
            onChange={(e) => setStatusCodeFilter(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="200">200 成功</option>
            <option value="201">201 创建</option>
            <option value="400">400 请求错误</option>
            <option value="401">401 未授权</option>
            <option value="429">429 频率限制</option>
            <option value="500">500 服务器错误</option>
          </select>
          <button style={styles.filterButton} onClick={handleFilter}>
            筛选
          </button>
          {(clothingTypeFilter || statusCodeFilter) && (
            <button style={styles.clearButton} onClick={handleClearFilters}>
              清除
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : (
        <>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>时间</th>
                <th style={styles.th}>服装类型</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>状态码</th>
                <th style={styles.th}>耗时</th>
                <th style={styles.th}>端点</th>
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {apiLogs.map((log) => {
                const statusBadge = getStatusBadge(log.statusCode);
                return (
                  <tr key={log.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      {new Date(log.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td style={styles.td}>
                      {getClothingTypeLabel(log.clothingType)}
                    </td>
                    <td style={styles.td}>
                      <code style={styles.code}>{log.category || '-'}</code>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, ...statusBadge.style }}>
                        {statusBadge.text}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDuration(log.duration)}</td>
                    <td style={styles.td}>
                      <span style={styles.endpoint}>{log.endpoint}</span>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.actionButton}
                        onClick={() => handleViewDetail(log)}
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={styles.pageButton}
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                上一页
              </button>
              <span style={styles.pageInfo}>
                第 {page} 页 / 共 {totalPages} 页 (共 {total} 条)
              </span>
              <button
                style={styles.pageButton}
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {showDetail && selectedLog && (
        <div style={styles.modal} onClick={() => setShowDetail(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>API 调用详情</h2>
              <button style={styles.closeButton} onClick={() => setShowDetail(false)}>×</button>
            </div>
            <div style={styles.detailSection}>
              <h3 style={styles.detailTitle}>基本信息</h3>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>时间:</span>
                  <span>{new Date(selectedLog.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>端点:</span>
                  <span style={styles.code}>{selectedLog.endpoint}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>方法:</span>
                  <span>{selectedLog.method}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>状态码:</span>
                  <span style={{ ...styles.statusBadge, ...getStatusBadge(selectedLog.statusCode).style }}>
                    {selectedLog.statusCode || '-'}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>耗时:</span>
                  <span>{formatDuration(selectedLog.duration)}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>任务ID:</span>
                  <span style={styles.code}>{selectedLog.taskId || '-'}</span>
                </div>
              </div>
            </div>

            <div style={styles.detailSection}>
              <h3 style={styles.detailTitle}>服装类型</h3>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>原始类型:</span>
                  <span>{getClothingTypeLabel(selectedLog.clothingType)}</span>
                  <span style={styles.code}>({selectedLog.clothingType || '-'})</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>映射后:</span>
                  <span style={styles.code}>{selectedLog.category || '-'}</span>
                </div>
              </div>
            </div>

            <div style={styles.detailSection}>
              <h3 style={styles.detailTitle}>请求参数</h3>
              <pre style={styles.jsonBlock}>
                {selectedLog.requestData ? JSON.stringify(selectedLog.requestData, null, 2) : '-'}
              </pre>
            </div>

            <div style={styles.detailSection}>
              <h3 style={styles.detailTitle}>响应数据</h3>
              <pre style={styles.jsonBlock}>
                {selectedLog.responseData ? JSON.stringify(selectedLog.responseData, null, 2) : '-'}
              </pre>
            </div>

            {selectedLog.errorMessage && (
              <div style={styles.detailSection}>
                <h3 style={styles.detailTitle}>错误信息</h3>
                <pre style={{ ...styles.jsonBlock, color: '#ff4d4f' }}>
                  {selectedLog.errorMessage}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#333',
    margin: 0,
  },
  filters: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
  },
  filterButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF4D6D 100%)',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  clearButton: {
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    background: 'white',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
  },
  error: {
    padding: '12px',
    background: '#fff2f0',
    border: '1px solid #ffccc7',
    borderRadius: '6px',
    color: '#ff4d4f',
    marginBottom: '16px',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#999',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    background: '#fafafa',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '14px',
    color: '#666',
    borderBottom: '2px solid #e5e7eb',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#333',
  },
  code: {
    padding: '2px 6px',
    background: '#f5f5f5',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  endpoint: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#666',
  },
  actionButton: {
    padding: '4px 12px',
    border: 'none',
    borderRadius: '4px',
    background: '#e6f7ff',
    color: '#1890ff',
    fontSize: '12px',
    cursor: 'pointer',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #f0f0f0',
  },
  pageButton: {
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    background: 'white',
    fontSize: '14px',
    cursor: 'pointer',
  },
  pageInfo: {
    fontSize: '14px',
    color: '#666',
  },
  modal: {
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
  },
  modalContent: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: '18px',
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
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666',
  },
  detailSection: {
    marginBottom: '20px',
  },
  detailTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#666',
    marginBottom: '12px',
    marginTop: 0,
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '12px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#333',
  },
  detailLabel: {
    fontWeight: 500,
    color: '#666',
    whiteSpace: 'nowrap',
  },
  jsonBlock: {
    padding: '12px',
    background: '#f9f9f9',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'monospace',
    overflow: 'auto',
    maxHeight: '300px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};
