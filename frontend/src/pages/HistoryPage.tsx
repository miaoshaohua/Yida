import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tryonAPI, TryOnTask } from '../services/api';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TryOnTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [previewTask, setPreviewTask] = useState<TryOnTask | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await tryonAPI.getMyTasks(1, 20);
      setTasks(data.tasks);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取历史记录失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleViewResult = (task: TryOnTask) => {
    if (task.status === 'COMPLETED' && task.resultImageUrl) {
      setPreviewTask(task);
    }
  };

  const handleSaveImage = async () => {
    if (!previewTask?.resultImageUrl) return;
    
    try {
      const response = await fetch(previewTask.resultImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yida-${previewTask.taskId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('保存失败，请长按图片手动保存');
    }
  };

  const handleBackFromPreview = () => {
    setPreviewTask(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchDelete = async () => {
    if (selectedTasks.size === 0) {
      alert('请先选择要删除的记录');
      return;
    }
    if (!confirm(`确定要删除选中的 ${selectedTasks.size} 条记录吗？`)) {
      return;
    }
    try {
      await Promise.all(
        Array.from(selectedTasks).map(taskId => tryonAPI.deleteTask(taskId))
      );
      setSelectedTasks(new Set());
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || '批量删除失败');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerIcon}>📜</span>
            <h1 style={styles.title}>试衣历史</h1>
          </div>
          <div style={styles.headerActions}>
            {selectedTasks.size > 0 && (
              <span style={styles.selectedCount}>已选 {selectedTasks.size} 项</span>
            )}
            <button 
              style={styles.headerButton} 
              onClick={handleBatchDelete}
              disabled={selectedTasks.size === 0}
            >
              批量删除
            </button>
          </div>
        </div>

        <div style={styles.content}>
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {loading && tasks.length === 0 && (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
              <p style={styles.loadingText}>加载中...</p>
            </div>
          )}

          {!loading && tasks.length === 0 && !error && (
            <div style={styles.emptyContainer}>
              <div style={styles.emptyIcon}>👗</div>
              <h2 style={styles.emptyTitle}>暂无试衣记录</h2>
              <p style={styles.emptyText}>开始您的第一次AI试衣体验吧！</p>
              <button 
                style={styles.button}
                onClick={() => navigate('/')}
              >
                开始试衣
              </button>
            </div>
          )}

          {tasks.length > 0 && (
            <>
              <div style={styles.grid}>
                {tasks.map((task) => (
                  <div 
                    key={task.id} 
                    style={styles.card}
                    onClick={() => handleViewResult(task)}
                  >
                    <div style={styles.imageContainer}>
                      {task.resultImageUrl ? (
                        <img 
                          src={task.resultImageUrl} 
                          alt="试衣" 
                          style={styles.image}
                        />
                      ) : (
                        <div style={styles.placeholderImage}>
                          <span style={styles.placeholderIcon}>⏳</span>
                          <span style={styles.statusLabel}>
                            {task.status === 'PROCESSING' ? '处理中' : '处理中'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={styles.cardInfo}>
                      <p style={styles.date}>
                        {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                      <input 
                        type="checkbox" 
                        style={styles.checkbox}
                        checked={selectedTasks.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p style={styles.footerNote}>
                云端历史永久保存 · 最近10条缓存到本地
              </p>
            </>
          )}
        </div>
      </div>

      {previewTask && (
        <div style={styles.overlay} onClick={handleBackFromPreview}>
          <div style={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.previewHeader}>
              <span style={styles.previewDate}>
                {new Date(previewTask.createdAt).toLocaleString('zh-CN')}
              </span>
            </div>
            <div style={styles.previewImageContainer}>
              <img 
                src={previewTask.resultImageUrl} 
                alt="试衣结果" 
                style={styles.previewImage}
              />
            </div>
            <div style={styles.previewFooter}>
              <button style={styles.saveButton} onClick={handleSaveImage}>
                💾 保存图片
              </button>
              <button style={styles.backButton} onClick={handleBackFromPreview}>
                ← 返回
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.bottomNav}>
        <div style={styles.navContainer}>
          <button 
            style={styles.navItem}
            onClick={() => navigate('/')}
          >
            <span style={styles.navIcon}>🏠</span>
            <span style={styles.navLabel}>首页</span>
          </button>
          <button 
            style={{ ...styles.navItem, ...styles.activeNavItem }}
          >
            <span style={styles.navIcon}>📜</span>
            <span style={styles.navLabel}>历史</span>
          </button>
          <button 
            style={styles.navItem}
            onClick={() => navigate('/profile')}
          >
            <span style={styles.navIcon}>👤</span>
            <span style={styles.navLabel}>我的</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #FFF5F8 0%, #FFE8EF 100%)',
    padding: '24px 20px 100px',
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
  header: {
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerIcon: {
    fontSize: '28px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'white',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: '13px',
    color: 'white',
    marginRight: '4px',
  },
  headerButton: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.3)',
    },
  },
  content: {
    padding: '24px',
  },
  error: {
    background: '#fff5f5',
    border: '1px solid #ffccc7',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#ff4d4f',
    marginBottom: '24px',
    textAlign: 'center',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
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
  emptyContainer: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 12px 0',
  },
  emptyText: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 24px 0',
  },
  button: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    background: 'linear-gradient(135deg, #FFF5F8 0%, #FFE8EF 100%)',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 8px 24px rgba(230, 0, 76, 0.15)',
      transform: 'translateY(-2px)',
    },
  },
  imageContainer: {
    aspectRatio: '3/4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: '48px',
  },
  cardInfo: {
    padding: '12px',
    background: 'white',
  },
  date: {
    fontSize: '12px',
    color: '#666',
    margin: '0 0 8px 0',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: '#E6004C',
    cursor: 'pointer',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'white',
    borderTop: '1px solid #f0f0f0',
    zIndex: 1000,
  },
  navContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '8px 0',
    maxWidth: '600px',
    margin: '0 auto',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#999',
    position: 'relative',
  },
  activeNavItem: {
    color: '#E6004C',
    '&::after': {
      content: '',
      position: 'absolute',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '30px',
      height: '3px',
      background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
      borderRadius: '0 0 3px 3px',
    },
  },
  navIcon: {
    fontSize: '24px',
    marginBottom: '4px',
  },
  navLabel: {
    fontSize: '12px',
    fontWeight: 500,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  previewModal: {
    background: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  previewHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
    background: '#fafafa',
  },
  previewDate: {
    fontSize: '14px',
    color: '#666',
  },
  previewImageContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: '400px',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '60vh',
    objectFit: 'contain',
  },
  previewFooter: {
    display: 'flex',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid #f0f0f0',
    background: '#fafafa',
  },
  saveButton: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  backButton: {
    flex: 1,
    padding: '12px',
    background: '#f5f5f5',
    color: '#333',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
