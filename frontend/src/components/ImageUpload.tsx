import React, { useState, useRef } from 'react';

interface ImageUploadProps {
  label: string;
  placeholder: string;
  onImageSelect: (file: File) => void;
  previewUrl?: string;
  onClear?: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  placeholder,
  onImageSelect,
  previewUrl,
  onClear,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={styles.container}>
      <div style={styles.label}>{label}</div>
      {previewUrl ? (
        <div style={styles.previewContainer}>
          <img src={previewUrl} alt="Preview" style={styles.previewImage} />
          {onClear && (
            <button style={styles.clearButton} onClick={onClear}>
              ✕
            </button>
          )}
        </div>
      ) : (
        <div
          style={{ ...styles.uploadArea, ...(isDragging ? styles.dragging : {}) }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div style={styles.uploadIcon}>📷</div>
          <div style={styles.uploadText}>{placeholder}</div>
          <div style={styles.uploadHint}>点击或拖拽上传</div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={styles.hiddenInput}
        onChange={handleFileChange}
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  },
  uploadArea: {
    border: '2px dashed #ddd',
    borderRadius: '12px',
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: '#fafafa',
  },
  dragging: {
    borderColor: '#E6004C',
    background: '#fff5f8',
  },
  uploadIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  uploadText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '8px',
  },
  uploadHint: {
    fontSize: '13px',
    color: '#999',
  },
  previewContainer: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '280px',
    objectFit: 'cover',
  },
  clearButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: {
    display: 'none',
  },
};
