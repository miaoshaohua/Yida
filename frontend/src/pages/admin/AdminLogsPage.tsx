import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';

interface LogItem {
  id: string;
  adminId: string | null;
  adminName: string;
  operationType: string;
  module: string | null;
  entityId: string | null;
  details: string | null;
  beforeData: string | null;
  afterData: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

const MODULE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '用户管理', value: 'USERS' },
  { label: '订单管理', value: 'ORDERS' },
  { label: '试衣记录', value: 'TRYON' },
  { label: '照片管理', value: 'PHOTOS' },
  { label: '管理员', value: 'ADMINS' },
  { label: '日志', value: 'LOGS' },
];

const OPERATION_TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '登录', value: 'LOGIN' },
  { label: '创建', value: 'CREATE_' },
  { label: '更新', value: 'UPDATE_' },
  { label: '删除', value: 'DELETE_' },
];

export const AdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showDetail, setShowDetail] = useState<LogItem | null>(null);
  const [filters, setFilters] = useState({ module: '', operationType: '', startDate: '', endDate: '' });

  const pageSize = 20;

  const fetchLogs = async (currentPage: number = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, pageSize };
      if (currentFilters.module) params.module = currentFilters.module;
      if (currentFilters.operationType) params.operationType = currentFilters.operationType;
      if (currentFilters.startDate) params.startDate = currentFilters.startDate;
      if (currentFilters.endDate) params.endDate = currentFilters.endDate;

      const response = await adminApi.get('/operation-logs', { params });
      setLogs(response.data.logs);
      setTotal(response.data.total);
      setPage(currentPage);
    } catch (err) {
      console.error('获取日志失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilter = () => {
    if (filters.startDate && filters.endDate && new Date(filters.endDate) < new Date(filters.startDate)) {
      alert('结束日期不能小于开始日期');
      return;
    }
    fetchLogs(1);
  };
  const handleReset = () => {
    setFilters({ module: '', operationType: '', startDate: '', endDate: '' });
    fetchLogs(1, { module: '', operationType: '', startDate: '', endDate: '' });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setFilters({ ...filters, startDate: newStartDate });
    if (filters.endDate && new Date(newStartDate) > new Date(filters.endDate)) {
      setFilters(prev => ({ ...prev, startDate: newStartDate, endDate: '' }));
    }
  };

  const getMinEndDate = () => filters.startDate || '';
  const getMaxStartDate = () => filters.endDate || '';

  const formatOperationType = (type: string) => {
    const map: { [key: string]: string } = {
      LOGIN: '登录',
      LOGOUT: '登出',
      UPDATE_PASSWORD: '修改密码',
      CREATE_USER: '创建用户',
      UPDATE_USER: '更新用户',
      DELETE_USER: '删除用户',
      CREATE_ORDER: '创建订单',
      UPDATE_ORDER: '更新订单',
      REFUND_ORDER: '退款订单',
      DELETE_RECORD: '删除试衣记录',
      BATCH_DELETE_RECORDS: '批量删除试衣记录',
      UPDATE_CONFIG: '更新配置',
      CREATE_ANNOUNCEMENT: '创建公告',
      DELETE_ANNOUNCEMENT: '删除公告',
      CREATE_ADMIN: '创建管理员',
      UPDATE_ADMIN: '更新管理员',
      DELETE_ADMIN: '删除管理员',
      UPDATE_PERMISSION: '更新权限',
    };
    return map[type] || type;
  };

  const formatModule = (module: string | null) => {
    if (!module) return '-';
    const map: { [key: string]: string } = {
      USERS: '用户管理',
      ORDERS: '订单管理',
      TRYON: '试衣记录',
      PHOTOS: '照片管理',
      ADMINS: '管理员',
      LOGS: '日志',
    };
    return map[module] || module;
  };

  const formatJSON = (data: any) => {
    if (!data) return '-';
    if (typeof data === 'string') {
      try {
        return JSON.stringify(JSON.parse(data), null, 2);
      } catch {
        return data;
      }
    }
    return JSON.stringify(data, null, 2);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AdminLayout>
      <div>
        <div style={styles.header}>
          <h1 style={styles.title}>操作日志</h1>
        </div>

        <div style={styles.filterSection}>
          <div style={styles.filterRow}>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>模块</label>
              <select
                style={styles.filterSelect}
                value={filters.module}
                onChange={(e) => setFilters({ ...filters, module: e.target.value })}
              >
                {MODULE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>操作类型</label>
              <select
                style={styles.filterSelect}
                value={filters.operationType}
                onChange={(e) => setFilters({ ...filters, operationType: e.target.value })}
              >
                {OPERATION_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>开始日期</label>
              <input
                type="date"
                style={styles.filterInput}
                value={filters.startDate}
                onChange={handleStartDateChange}
                max={getMaxStartDate()}
              />
            </div>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>结束日期</label>
              <input
                type="date"
                style={styles.filterInput}
                value={filters.endDate}
                min={getMinEndDate()}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>&nbsp;</label>
              <div style={styles.filterButtons}>
                <button style={styles.btnPrimary} onClick={handleFilter}>查询</button>
                <button style={styles.btnDefault} onClick={handleReset}>重置</button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>加载中...</div>
        ) : (
          <>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>时间</th>
                    <th style={styles.th}>管理员</th>
                    <th style={styles.th}>模块</th>
                    <th style={styles.th}>操作</th>
                    <th style={styles.th}>详情</th>
                    <th style={styles.th}>IP地址</th>
                    <th style={styles.th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={styles.tableRow}>
                      <td style={styles.td}>{new Date(log.createdAt).toLocaleString('zh-CN')}</td>
                      <td style={styles.td}>{log.adminName || '-'}</td>
                      <td style={styles.td}>{formatModule(log.module)}</td>
                      <td style={styles.td}>{formatOperationType(log.operationType)}</td>
                      <td style={{ ...styles.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details || '-'}</td>
                      <td style={styles.td}>{log.ipAddress || '-'}</td>
                      <td style={styles.td}>
                        <button style={styles.actionBtn} onClick={() => setShowDetail(log)}>
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {logs.length === 0 && (
              <div style={styles.empty}>暂无日志数据</div>
            )}

            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button style={styles.pageBtn} disabled={page <= 1} onClick={() => fetchLogs(page - 1)}>
                  上一页
                </button>
                <span style={styles.pageInfo}>
                  第 {page} 页 / 共 {totalPages} 页 ({total} 条)
                </span>
                <button style={styles.pageBtn} disabled={page >= totalPages} onClick={() => fetchLogs(page + 1)}>
                  下一页
                </button>
              </div>
            )}
          </>
        )}

        {showDetail && (
          <div style={styles.modalOverlay} onClick={() => setShowDetail(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>日志详情</h2>
                <button style={styles.modalClose} onClick={() => setShowDetail(null)}>✕</button>
              </div>
              <div style={styles.modalContent}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>时间：</span>
                  <span style={styles.detailValue}>{new Date(showDetail.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>管理员：</span>
                  <span style={styles.detailValue}>{showDetail.adminName || '-'}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>操作：</span>
                  <span style={styles.detailValue}>{formatOperationType(showDetail.operationType)}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>模块：</span>
                  <span style={styles.detailValue}>{formatModule(showDetail.module)}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>IP地址：</span>
                  <span style={styles.detailValue}>{showDetail.ipAddress || '-'}</span>
                </div>
                <div style={styles.detailSection}>
                  <div style={styles.detailSectionTitle}>详情描述</div>
                  <div style={styles.detailBox}>{showDetail.details || '-'}</div>
                </div>
                <div style={styles.detailSection}>
                  <div style={styles.detailSectionTitle}>操作前数据</div>
                  <pre style={styles.pre}>{formatJSON(showDetail.beforeData)}</pre>
                </div>
                <div style={styles.detailSection}>
                  <div style={styles.detailSectionTitle}>操作后数据</div>
                  <pre style={styles.pre}>{formatJSON(showDetail.afterData)}</pre>
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
  header: { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '24px', fontWeight: 600, color: '#333', margin: 0 },
  filterSection: { background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterItem: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' },
  filterLabel: { fontSize: '14px', color: '#666' },
  filterSelect: { padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '6px', fontSize: '14px' },
  filterInput: { padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '6px', fontSize: '14px' },
  filterButtons: { display: 'flex', gap: '8px' },
  btnPrimary: { padding: '8px 16px', border: 'none', borderRadius: '6px', background: '#E6004C', color: 'white', cursor: 'pointer' },
  btnDefault: { padding: '8px 16px', border: '1px solid #d9d9d9', borderRadius: '6px', background: 'white', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '60px 20px', color: '#999' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#999' },
  tableContainer: { background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#fafafa' },
  th: { padding: '14px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#333', borderBottom: '1px solid #f0f0f0' },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#666' },
  actionBtn: { padding: '6px 12px', border: 'none', borderRadius: '4px', background: '#e6f7ff', color: '#1890ff', cursor: 'pointer', fontSize: '13px' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' },
  pageBtn: { padding: '8px 16px', border: '1px solid #d9d9d9', borderRadius: '6px', background: 'white', cursor: 'pointer' },
  pageInfo: { fontSize: '14px', color: '#666' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: 'white', borderRadius: '12px', width: '700px', maxWidth: '90vw', maxHeight: '85vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f0f0f0' },
  modalTitle: { fontSize: '18px', fontWeight: 600, margin: 0 },
  modalClose: { border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' },
  modalContent: { padding: '24px' },
  detailRow: { display: 'flex', gap: '8px', marginBottom: '12px', fontSize: '14px' },
  detailLabel: { fontWeight: 500, color: '#666', minWidth: '80px' },
  detailValue: { color: '#333' },
  detailSection: { marginTop: '20px' },
  detailSectionTitle: { fontWeight: 500, color: '#333', marginBottom: '8px', fontSize: '14px' },
  detailBox: { background: '#f5f5f5', padding: '12px', borderRadius: '6px', fontSize: '14px', color: '#333', wordBreak: 'break-word' },
  pre: { background: '#f5f5f5', padding: '12px', borderRadius: '6px', fontSize: '12px', lineHeight: 1.6, overflow: 'auto', maxHeight: '200px', color: '#333' },
};
