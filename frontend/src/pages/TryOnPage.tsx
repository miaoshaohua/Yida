import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ImageUpload } from '../components/ImageUpload';
import { Button } from '../components/Button';
import { storageAPI, tryonAPI } from '../services/api';

export const TryOnPage: React.FC = () => {
  const navigate = useNavigate();
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [clothingFile, setClothingFile] = useState<File | null>(null);
  const [personPreviewUrl, setPersonPreviewUrl] = useState<string>('');
  const [clothingPreviewUrl, setClothingPreviewUrl] = useState<string>('');
  const [clothingType, setClothingType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const clothingTypeOptions = [
    { value: 'TOP', label: '上装', icon: '👕' },
    { value: 'BOTTOM', label: '下装', icon: '👖' },
    { value: 'FULL_BODY', label: '连体装', icon: '🩱' },
  ];

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
    return await storageAPI.uploadViaBackend(file);
  };

  const handleStartTryOn = async () => {
    if (!personFile || !clothingFile) {
      setError('请先上传人物照片和衣服照片');
      return;
    }

    if (!clothingType) {
      setError('请选择服装类型');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const personImageKey = await uploadImage(personFile);
      const clothImageKey = await uploadImage(clothingFile);
      
      const task = await tryonAPI.createTask({
        personImageKey,
        clothImageKey,
        clothingType: clothingType as any,
      });

      navigate(`/loading/${task.taskId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || '试衣请求失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Header />
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.titleSection}>
            <h1 style={styles.title}>开始试衣</h1>
            <p style={styles.subtitle}>上传人物照片和衣服照片，体验AI虚拟试衣</p>
          </div>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <div style={styles.uploadSection}>
            <div style={styles.uploadColumn}>
              <ImageUpload
                label="人物照片"
                placeholder="请上传正面、清晰的人物照片"
                onImageSelect={handlePersonImageSelect}
                previewUrl={personPreviewUrl}
                onClear={handleClearPersonImage}
              />
            </div>

            <div style={styles.arrowContainer}>
              <div style={styles.arrow}>➡️</div>
            </div>

            <div style={styles.uploadColumn}>
              <ImageUpload
                label="衣服照片"
                placeholder="请上传衣服的正面照片"
                onImageSelect={handleClothingImageSelect}
                previewUrl={clothingPreviewUrl}
                onClear={handleClearClothingImage}
              />
            </div>
          </div>

          <div style={styles.clothingTypeSection}>
            <h3 style={styles.clothingTypeTitle}>服装类型 <span style={styles.required}>*</span></h3>
            <div style={styles.clothingTypeOptions}>
              {clothingTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  style={{
                    ...styles.clothingTypeButton,
                    ...(clothingType === option.value ? styles.clothingTypeButtonActive : {}),
                  }}
                  onClick={() => setClothingType(option.value)}
                >
                  <span style={styles.clothingTypeIcon}>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
            {!clothingType && <p style={styles.clothingTypeHint}>请选择服装类型</p>}
          </div>

          <div style={styles.buttonSection}>
            <Button
              size="large"
              fullWidth
              disabled={!personFile || !clothingFile || !clothingType}
              loading={loading}
              onClick={handleStartTryOn}
            >
              ✨ 开始试衣
            </Button>
          </div>

          <div style={styles.tipsSection}>
            <h3 style={styles.tipsTitle}>上传建议</h3>
            <ul style={styles.tipsList}>
              <li>人物照片：正面、清晰，光线充足</li>
              <li>人物尽量穿着浅色、贴身的衣服</li>
              <li>衣服照片：正面、平整，无明显褶皱</li>
              <li>支持 JPG、PNG 格式，单张不超过 10MB</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #fff5f8 0%, #ffffff 100%)',
    paddingBottom: '80px',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  container: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  titleSection: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#333',
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
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
  uploadSection: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },
  uploadColumn: {
    flex: 1,
    minWidth: '280px',
  },
  arrowContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
  },
  arrow: {
    fontSize: '48px',
    color: '#E6004C',
  },
  clothingTypeSection: {
    marginBottom: '32px',
  },
  clothingTypeTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 16px 0',
    textAlign: 'center',
  },
  required: {
    color: '#ff4d4f',
    fontSize: '18px',
  },
  clothingTypeHint: {
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    marginTop: '8px',
    marginBottom: 0,
  },
  clothingTypeOptions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  clothingTypeButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '12px 20px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    background: 'white',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '80px',
  },
  clothingTypeButtonActive: {
    border: '2px solid #E6004C',
    background: '#fff5f8',
    color: '#E6004C',
    fontWeight: 600,
  },
  clothingTypeIcon: {
    fontSize: '24px',
  },
  buttonSection: {
    marginBottom: '32px',
  },
  tipsSection: {
    background: '#fafafa',
    borderRadius: '12px',
    padding: '24px',
  },
  tipsTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 16px 0',
  },
  tipsList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#666',
    lineHeight: '2',
  },
};
