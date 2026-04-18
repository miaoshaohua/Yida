import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
}) => {
  return (
    <button
      style={{
        ...styles.base,
        ...styles[variant],
        ...styles[size],
        ...(fullWidth ? styles.fullWidth : {}),
        ...((disabled || loading) ? styles.disabled : {}),
      }}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? '加载中...' : children}
    </button>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  base: {
    border: 'none',
    borderRadius: '25px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  primary: {
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(230, 0, 76, 0.3)',
  },
  secondary: {
    background: '#f5f5f5',
    color: '#333',
  },
  outline: {
    background: 'transparent',
    color: '#E6004C',
    border: '2px solid #E6004C',
  },
  small: {
    padding: '8px 20px',
    fontSize: '14px',
  },
  medium: {
    padding: '12px 32px',
    fontSize: '16px',
  },
  large: {
    padding: '16px 48px',
    fontSize: '18px',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};
