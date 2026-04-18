import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storageAPI, tryonAPI } from '../services/api';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [clothingFile, setClothingFile] = useState<File | null>(null);
  const [personPreviewUrl, setPersonPreviewUrl] = useState<string>('');
  const [clothingPreviewUrl, setClothingPreviewUrl] = useState<string>('');
  const [category, setCategory] = useState<'tops' | 'bottoms' | 'onepiece' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePersonImageSelect = (file: File) => {
    setPersonFile(file);
    setPersonPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleClothingImageSelect = (file: File) => {
    setClothingFile(file);
    setClothingPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleClearPersonImage = () => {
    setPersonFile(null);
    setPersonPreviewUrl('');
  };

  const handleClearClothingImage = () => {
    setClothingFile(null);
    setClothingPreviewUrl('');
  };

  const uploadImage = async (file: File): Promise<string> => {
    const { fileKey } = await storageAPI.getPresignedUrl(file.name);
    await storageAPI.uploadFile(fileKey, file);
    return fileKey;
  };

  const handleStartTryOn = async () => {
    if (!personFile || !clothingFile) {
      setError('请先上传人物照片和衣服照片');
      return;
    }

    if (!category) {
      setError('请选择服装类型');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const personImageKey = await uploadImage(personFile);
      const clothImageKey = await uploadImage(clothingFile);
      
      const categoryMap: Record<string, string> = {
        'tops': 'TOP',
        'bottoms': 'BOTTOM',
        'onepiece': 'FULL_BODY',
      };
      
      const task = await tryonAPI.createTask({
        personImageKey,
        clothImageKey,
        clothingType: categoryMap[category] as any,
      });

      navigate(`/loading/${task.taskId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || '试衣请求失败，请重试');
      setLoading(false);
    }
  };

  const remainingCount = user ? (user.isMember ? '无限' : Math.max(0, 3 - user.dailyTryOnCount)) : 3;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.headerIcon}>👗</span>
          <h1 style={styles.title}>AI虚拟试衣间</h1>
          <p style={styles.subtitle}>一秒试穿，预见美丽</p>
        </div>

        <div style={styles.content}>
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <div 
            style={styles.uploadZone}
            onClick={() => !personFile && document.getElementById('person-upload')?.click()}
          >
            {!personFile ? (
              <>
                <div style={styles.uploadIcon}>👤</div>
                <p style={styles.uploadTitle}>上传人物照片</p>
                <p style={styles.uploadDesc}>请上传清晰的正面全身照</p>
              </>
            ) : (
              <div style={styles.previewContainer}>
                <img src={personPreviewUrl} alt="人物预览" style={styles.previewImage} />
                <button 
                  style={styles.clearButton}
                  onClick={(e) => { e.stopPropagation(); handleClearPersonImage(); }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <input 
            id="person-upload"
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handlePersonImageSelect(e.target.files[0])}
          />

          <div 
            style={styles.uploadZone}
            onClick={() => !clothingFile && document.getElementById('clothing-upload')?.click()}
          >
            {!clothingFile ? (
              <>
                <div style={styles.uploadIcon}>👕</div>
                <p style={styles.uploadTitle}>上传衣服图片</p>
                <p style={styles.uploadDesc}>请上传平铺或模特穿搭图</p>
              </>
            ) : (
              <div style={styles.previewContainer}>
                <img src={clothingPreviewUrl} alt="衣服预览" style={styles.previewImage} />
                <button 
                  style={styles.clearButton}
                  onClick={(e) => { e.stopPropagation(); handleClearClothingImage(); }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <input 
            id="clothing-upload"
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleClothingImageSelect(e.target.files[0])}
          />

          <div style={styles.categorySection}>
            <span style={styles.categoryTitle}>服装类型 <span style={styles.required}>*</span></span>
            <div style={styles.categoryOptions}>
              <div style={styles.categoryItem}>
                <input 
                  type="radio" 
                  id="tops" 
                  name="category" 
                  checked={category === 'tops'}
                  onChange={() => setCategory('tops')}
                  style={styles.radioInput}
                />
                <label htmlFor="tops" style={styles.categoryLabel}>上装</label>
              </div>
              <div style={styles.categoryItem}>
                <input 
                  type="radio" 
                  id="bottoms" 
                  name="category" 
                  checked={category === 'bottoms'}
                  onChange={() => setCategory('bottoms')}
                  style={styles.radioInput}
                />
                <label htmlFor="bottoms" style={styles.categoryLabel}>下装</label>
              </div>
              <div style={styles.categoryItem}>
                <input 
                  type="radio" 
                  id="onepiece" 
                  name="category" 
                  checked={category === 'onepiece'}
                  onChange={() => setCategory('onepiece')}
                  style={styles.radioInput}
                />
                <label htmlFor="onepiece" style={styles.categoryLabel}>连体装</label>
              </div>
            </div>
          </div>

          <button 
            style={{ 
              ...styles.startButton, 
              opacity: (!personFile || !clothingFile || !category || loading) ? 0.6 : 1 
            }}
            onClick={handleStartTryOn}
            disabled={!personFile || !clothingFile || !category || loading}
          >
            {loading ? '处理中...' : '✨ 开始试衣'}
          </button>

          <div style={styles.remainingSection}>
            <div style={styles.remainingBadge}>
              <span style={styles.remainingNumber}>{remainingCount}</span>
            </div>
            <span style={styles.remainingText}>今日剩余试衣次数</span>
          </div>

          <p style={styles.noteText}>
            图片将加密存储30天以便您查看历史，您可随时删除。
          </p>
        </div>
      </div>

      <div style={styles.bottomNav}>
        <div style={styles.navContainer}>
          <button 
            style={{ ...styles.navItem, ...styles.activeNavItem }}
          >
            <span style={styles.navIcon}>🏠</span>
            <span style={styles.navLabel}>首页</span>
          </button>
          <button 
            style={styles.navItem}
            onClick={() => navigate('/history')}
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
    padding: '32px 20px 100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: '32px 24px',
    textAlign: 'center',
    color: 'white',
  },
  headerIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    margin: '0 0 4px 0',
    color: 'white',
  },
  subtitle: {
    fontSize: '14px',
    margin: 0,
    opacity: 0.9,
  },
  content: {
    padding: '32px',
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
  uploadZone: {
    border: '2px dashed #E6004C',
    background: 'rgba(230, 0, 76, 0.03)',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '16px',
  },
  uploadIcon: {
    fontSize: '56px',
    marginBottom: '12px',
  },
  uploadTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#E6004C',
    margin: '0 0 4px 0',
  },
  uploadDesc: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  previewContainer: {
    position: 'relative',
    display: 'inline-block',
  },
  previewImage: {
    maxWidth: '200px',
    maxHeight: '200px',
    borderRadius: '12px',
    objectFit: 'cover',
  },
  clearButton: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#E6004C',
    color: 'white',
    border: 'none',
    fontSize: '20px',
    lineHeight: '28px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  categoryTitle: {
    fontSize: '16px',
    color: '#333',
    fontWeight: 600,
  },
  required: {
    color: '#ff4d4f',
    fontSize: '16px',
  },
  categoryOptions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '32px',
  },
  categoryHint: {
    fontSize: '14px',
    color: '#999',
    margin: 0,
  },
  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  radioInput: {
    width: '20px',
    height: '20px',
    accentColor: '#E6004C',
    cursor: 'pointer',
  },
  categoryLabel: {
    fontSize: '16px',
    color: '#333',
    fontWeight: 500,
    cursor: 'pointer',
  },
  startButton: {
    width: '100%',
    padding: '18px',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '18px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(230, 0, 76, 0.3)',
    transition: 'all 0.3s ease',
    marginBottom: '20px',
  },
  remainingSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '20px',
  },
  remainingBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingNumber: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'white',
  },
  remainingText: {
    fontSize: '12px',
    color: '#666',
  },
  noteText: {
    fontSize: '12px',
    color: '#999',
    textAlign: 'center',
    margin: 0,
  },
};

export default HomePage;
