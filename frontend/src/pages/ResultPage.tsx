import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tryonAPI, TryOnTask } from '../services/api';

export const ResultPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TryOnTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;

      try {
        const data = await tryonAPI.getTask(taskId);
        setTask(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || '获取试衣结果失败');
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleDownload = () => {
    if (task?.resultImageUrl) {
      const link = document.createElement('a');
      link.href = task.resultImageUrl;
      link.download = `yida-tryon-${taskId}.jpg`;
      link.click();
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={styles.errorTitle}>加载失败</h2>
          <p style={styles.errorText}>{error || '无法获取试衣结果'}</p>
          <button 
            style={styles.button}
            onClick={() => navigate('/history')}
          >
            查看历史记录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>✨ 试衣效果生成成功！</h1>
        </div>

        <div style={styles.content}>
          <div style={styles.imageContainer}>
            <div style={styles.imageWrapper}>
              {task.resultImageUrl && (
                <img 
                  src={task.resultImageUrl} 
                  alt="试衣结果" 
                  style={styles.resultImage} 
                />
              )}
            </div>
          </div>

          <div style={styles.buttonSection}>
            <button 
              style={styles.primaryButton}
              onClick={handleDownload}
              disabled={!task.resultImageUrl}
            >
              <span style={styles.buttonIcon}>💾</span> 保存图片
            </button>
            <button 
              style={styles.secondaryButton}
              onClick={() => navigate('/')}
            >
              <span style={styles.buttonIcon}>🔄</span> 重新试衣
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #FFF5F8 0%, #FFE8EF 100%)',
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    maxWidth: '600px',
    width: '100%',
    background: 'white',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
  header: {
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    padding: '24px',
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'white',
    margin: 0,
  },
  content: {
    padding: '32px',
  },
  imageContainer: {
    background: 'linear-gradient(135deg, #FFF5F8 0%, #FFE8EF 100%)',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'center',
  },
  imageWrapper: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    width: '280px',
  },
  resultImage: {
    width: '100%',
    height: '360px',
    objectFit: 'cover',
    display: 'block',
  },
  buttonSection: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(230, 0, 76, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  secondaryButton: {
    padding: '14px 32px',
    background: 'white',
    color: '#E6004C',
    border: '2px solid #E6004C',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: '#FFF5F8',
    },
  },
  buttonIcon: {
    fontSize: '18px',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #E6004C',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
  },
  errorIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 12px 0',
  },
  errorText: {
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
};
