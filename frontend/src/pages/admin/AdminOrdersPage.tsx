import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminOrdersAPI, Order } from '../../services/adminApi';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const pageSize = 20;

  const fetchOrders = async (currentPage: number = 1, status: string = '') => {
    try {
      setLoading(true);
      setError('');
      const data = await adminOrdersAPI.getOrders(currentPage, pageSize, status || undefined);
      setOrders(data.orders);
      setTotal(data.total);
      setPage(currentPage);
      setStatusFilter(status);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取订单列表失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; style: React.CSSProperties } } = {
      PENDING: { text: '待支付', style: { background: '#fff7e6', color: '#fa8c16' } },
      PAID: { text: '已支付', style: { background: '#f6ffed', color: '#52c41a' } },
      REFUNDED: { text: '已退款', style: { background: '#fff1f0', color: '#ff4d4f' } },
      CANCELLED: { text: '已取消', style: { background: '#f5f5f5', color: '#666' } },
    };
    return statusMap[status] || { text: status, style: { background: '#f5f5f5', color: '#666' } };
  };

  const getProductTypeText = (type: string) => {
    return type === 'MONTHLY' ? '月卡' : '年卡';
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AdminLayout>
      <div>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>订单管理</h1>
          <div style={styles.filterSection}>
            <select
              style={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => fetchOrders(1, e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="PENDING">待支付</option>
              <option value="PAID">已支付</option>
              <option value="REFUNDED">已退款</option>
              <option value="CANCELLED">已取消</option>
            </select>
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
                    <th style={styles.th}>订单号</th>
                    <th style={styles.th}>用户</th>
                    <th style={styles.th}>金额</th>
                    <th style={styles.th}>产品</th>
                    <th style={styles.th}>状态</th>
                    <th style={styles.th}>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const statusBadge = getStatusBadge(order.status);
                    return (
                      <tr key={order.id} style={styles.tableRow}>
                        <td style={styles.td}>{order.orderNo}</td>
                        <td style={styles.td}>
                          {order.user?.nickname || order.user?.phone || '未知用户'}
                        </td>
                        <td style={styles.td}>¥{order.amount.toFixed(2)}</td>
                        <td style={styles.td}>{getProductTypeText(order.productType)}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.statusBadge, ...statusBadge.style }}>
                            {statusBadge.text}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {new Date(order.createdAt).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {orders.length === 0 && (
              <div style={styles.emptyContainer}>
                <div style={styles.emptyIcon}>📦</div>
                <p style={styles.emptyText}>暂无订单数据</p>
              </div>
            )}

            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  style={styles.paginationButton}
                  disabled={page <= 1}
                  onClick={() => fetchOrders(page - 1, statusFilter)}
                >
                  上一页
                </button>
                <span style={styles.paginationInfo}>
                  第 {page} 页 / 共 {totalPages} 页 ({total} 条)
                </span>
                <button
                  style={styles.paginationButton}
                  disabled={page >= totalPages}
                  onClick={() => fetchOrders(page + 1, statusFilter)}
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
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
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
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
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
