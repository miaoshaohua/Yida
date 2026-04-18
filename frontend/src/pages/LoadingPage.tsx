import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tryonAPI, TryOnTask } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const LoadingPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [_task, setTask] = useState<TryOnTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pollingCount, setPollingCount] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  const loadingTips = [
    "正在上传图片...",
    "正在检测人物特征...",
    "正在分析服装样式...",
    "正在生成试衣效果...",
    "即将完成，请稍候..."
  ];

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % loadingTips.length);
    }, 5000);
    return () => clearInterval(tipInterval);
  }, []);

  const fetchTask = async () => {
    if (!taskId) return;

    try {
      const data = await tryonAPI.getTask(taskId);
      setTask(data);
      setLoading(false);

      if (data.status === 'COMPLETED') {
        refreshUser(); // 刷新用户信息，更新剩余次数
        setTimeout(() => {
          navigate(`/result/${taskId}`);
        }, 1000);
      } else if (data.status === 'FAILED') {
        setError(data.errorMessage || '试衣过程中出现错误，请稍后重试');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '获取任务状态失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();

    const interval = setInterval(() => {
      setPollingCount((prev) => prev + 1);
      fetchTask();
    }, 3000);

    return () => clearInterval(interval);
  }, [taskId]);

  useEffect(() => {
    if (pollingCount > 60) {
      setError('试衣时间过长，请稍后查看历史记录');
    }
  }, [pollingCount]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.spinnerContainer}>
          <div style={styles.spinner}></div>
        </div>
        <h1 style={styles.title}>正在生成试衣效果...</h1>
        <p style={styles.subtitle}>首次生成可能较慢，请耐心等待</p>
        
        <div style={styles.tipBox}>
          <p style={styles.tipLabel}>💡 通用提示：</p>
          <p style={styles.tipText}>{loadingTips[currentTip]}</p>
        </div>

        <p style={styles.noteText}>
          📌 生成时间较长？可稍后到历史记录中查看
        </p>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
            <button 
              style={styles.retryButton}
              onClick={() => navigate('/')}
            >
              重新试衣
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #FFF5F8 0%, #FFE8EF 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  container: {
    background: 'white',
    borderRadius: '24px',
    padding: '48px 32px',
    maxWidth: '450px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
  spinnerContainer: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: '24px',
  },
  spinner: {
    width: '80px',
    height: '80px',
    border: '4px solid #FFE0E8',
    borderTop: '4px solid #E6004C',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#333',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 24px 0',
  },
  tipBox: {
    background: 'linear-gradient(135deg, #FFF5F8 0%, #FFE8EF 100%)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
  },
  tipLabel: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 8px 0',
  },
  tipText: {
    fontSize: '15px',
    color: '#E6004C',
    fontWeight: 500,
    margin: 0,
  },
  noteText: {
    fontSize: '13px',
    color: '#999',
    margin: 0,
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
    marginTop: '20px',
  },
  errorBox: {
    marginTop: '24px',
    background: '#FFF5F5',
    borderRadius: '16px',
    padding: '24px',
  },
  errorText: {
    fontSize: '14px',
    color: '#FF4D4F',
    margin: '0 0 16px 0',
  },
  retryButton: {
    padding: '12px 32px',
    border: 'none',
    borderRadius: '24px',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    color: 'white',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
