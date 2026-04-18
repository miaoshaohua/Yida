import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminPhotosAPI, Photo } from '../../services/adminApi';

export const AdminPhotosPage: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [expiringSoon, setExpiringSoon] = useState(false);

  const pageSize = 20;

  const fetchPhotos = async (currentPage: number = 1, expiring: boolean = false) => {
    try {
      setLoading(true);
      setError('');
      const data = await adminPhotosAPI.getPhotos(currentPage, pageSize, expiring);
      setPhotos(data.photos);
      setTotal(data.total);
      setPage(currentPage);
      setExpiringSoon(expiring);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取照片列表失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getRemainingDays = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AdminLayout>
      <div>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>照片管理</h1>
          <div style={styles.filterSection}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={expiringSoon}
                onChange={(e) => fetchPhotos(1, e.target.checked)}
              />
              仅显示即将过期（7天内）
            </label>
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
                    <th style={styles.th}>文件名</th>
                    <th style={styles.th}>大小</th>
                    <th style={styles.th}>类型</th>
                    <th style={styles.th}>剩余天数</th>
                    <th style={styles.th}>过期时间</th>
                    <th style={styles.th}>上传时间</th>
                  </tr>
                </thead>
                <tbody>
                  {photos.map((photo) => {
                    const remainingDays = getRemainingDays(photo.expiresAt);
                    const isExpiringSoon = remainingDays <= 7 && remainingDays > 0;
                    const isExpired = remainingDays <= 0;
                    return (
                      <tr key={photo.id} style={styles.tableRow}>
                        <td style={styles.td} title={photo.fileName}>
                          {photo.fileName.length > 40 ? photo.fileName.slice(0, 40) + '...' : photo.fileName}
                        </td>
                        <td style={styles.td}>{formatFileSize(photo.fileSize)}</td>
                        <td style={styles.td}>{photo.mimeType}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.daysBadge,
                            ...(isExpired ? styles.expired : isExpiringSoon ? styles.expiringSoon : {}),
                          }}>
                            {isExpired ? '已过期' : `${remainingDays}天`}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {new Date(photo.expiresAt).toLocaleString('zh-CN')}
                        </td>
                        <td style={styles.td}>
                          {new Date(photo.createdAt).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {photos.length === 0 && (
              <div style={styles.emptyContainer}>
                <div style={styles.emptyIcon}>🖼️</div>
                <p style={styles.emptyText}>暂无照片数据</p>
              </div>
            )}

            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  style={styles.paginationButton}
                  disabled={page <= 1}
                  onClick={() => fetchPhotos(page - 1, expiringSoon)}
                >
                  上一页
                </button>
                <span style={styles.paginationInfo}>
                  第 {page} 页 / 共 {totalPages} 页 ({total} 条)
                </span>
                <button
                  style={styles.paginationButton}
                  disabled={page >= totalPages}
                  onClick={() => fetchPhotos(page + 1, expiringSoon)}
                >
                  下一页
                </button>
              </div>
            )}
          </>
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
  filterSection: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666',
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
  daysBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
    background: '#f6ffed',
    color: '#52c41a',
  },
  expiringSoon: {
    background: '#fff7e6',
    color: '#fa8c16',
  },
  expired: {
    background: '#fff1f0',
    color: '#ff4d4f',
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
};
