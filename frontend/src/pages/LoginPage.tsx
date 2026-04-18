import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { generateFingerprint } from '../utils/fingerprint';

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'guest' | 'sms'>('guest');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const deviceId = getDeviceId();
      const fingerprint = await generateFingerprint();
      const response = await authAPI.guestLogin(deviceId, fingerprint);
      login(response.access_token, response.user);
      navigate('/');
    } catch (error) {
      console.error('游客登录失败:', error);
      alert('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phone) {
      alert('请输入手机号');
      return;
    }
    setLoading(true);
    try {
      await authAPI.sendSms(phone);
      setCodeSent(true);
      alert('验证码已发送（演示模式：123456）');
    } catch (error) {
      console.error('发送验证码失败:', error);
      alert('发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSmsLogin = async () => {
    if (!phone || !code) {
      alert('请输入手机号和验证码');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.smsLogin(phone, code);
      login(response.access_token, response.user);
      navigate('/');
    } catch (error) {
      console.error('短信登录失败:', error);
      alert('登录失败，请检查验证码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>👗</div>
          <h1 style={styles.title}>AI虚拟试衣间</h1>
          <p style={styles.subtitle}>欢迎回来！请登录以继续</p>
        </div>

        <div style={styles.content}>
          {mode === 'guest' ? (
            <div style={styles.guestSection}>
              <p style={styles.guestText}>无需注册，直接体验</p>
              <button
                onClick={handleGuestLogin}
                disabled={loading}
                style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? '登录中...' : '立即体验'}
              </button>
              <div style={styles.divider}>
                <span style={styles.dividerText}>或</span>
              </div>
              <button
                onClick={() => setMode('sms')}
                style={styles.secondaryButton}
              >
                手机号登录
              </button>
            </div>
          ) : (
            <div style={styles.smsSection}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>手机号</label>
                <div style={styles.phoneInput}>
                  <span style={styles.countryCode}>+86</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    style={styles.input}
                  />
                </div>
              </div>

              {codeSent && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>验证码</label>
                  <div style={styles.codeInput}>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="请输入验证码"
                      style={styles.input}
                    />
                    <button
                      style={styles.sendCodeButton}
                    >
                      获取验证码
                    </button>
                  </div>
                </div>
              )}

              {!codeSent ? (
                <button
                  onClick={handleSendCode}
                  disabled={loading}
                  style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? '发送中...' : '获取验证码'}
                </button>
              ) : (
                <button
                  onClick={handleSmsLogin}
                  disabled={loading}
                  style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? '登录中...' : '登录 / 注册'}
                </button>
              )}

              <div style={styles.registerText}>
                <span style={{ color: '#999' }}>✨ 每一次试衣，遇见更美的自己</span>
              </div>

              <button
                onClick={() => setMode('guest')}
                style={styles.backButton}
              >
                ← 返回游客登录
              </button>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>登录即表示同意</p>
          <p style={styles.footerLinks}>
            <a href="#" style={styles.footerLink}>用户协议</a>
            <span>与</span>
            <a href="#" style={styles.footerLink}>隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #FFF5F8 0%, #FFE8EF 100%)',
    padding: '48px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    maxWidth: '400px',
    width: '100%',
    background: 'white',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
  logoSection: {
    padding: '32px 24px 24px',
    textAlign: 'center',
  },
  logoIcon: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  content: {
    padding: '0 24px 24px',
  },
  guestSection: {
    textAlign: 'center',
  },
  guestText: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '24px',
  },
  button: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(230, 0, 76, 0.3)',
    transition: 'all 0.3s ease',
  },
  secondaryButton: {
    width: '100%',
    padding: '14px',
    background: 'white',
    color: '#E6004C',
    border: '2px solid #E6004C',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
  },
  dividerText: {
    flex: 1,
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    position: 'relative',
    '&::before, &::after': {
      content: '',
      position: 'absolute',
      top: '50%',
      width: '30%',
      height: '1px',
      background: '#e0e0e0',
    },
    '&::before': {
      left: 0,
    },
    '&::after': {
      right: 0,
    },
  },
  smsSection: {},
  inputGroup: {
    marginBottom: '16px',
    textAlign: 'left',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  phoneInput: {
    display: 'flex',
  },
  countryCode: {
    background: '#f5f5f5',
    border: '1px solid #ddd',
    borderRight: 'none',
    borderRadius: '12px 0 0 12px',
    padding: '14px 16px',
    fontSize: '15px',
    color: '#666',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '14px 16px',
    border: '1px solid #ddd',
    borderRadius: '0 12px 12px 0',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.3s ease',
    '&:focus': {
      borderColor: '#E6004C',
    },
  },
  codeInput: {
    display: 'flex',
    gap: '12px',
  },
  sendCodeButton: {
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #E6004C 0%, #FF2A6D 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  registerText: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px',
    color: '#666',
  },
  registerLink: {
    color: '#E6004C',
    textDecoration: 'none',
    marginLeft: '4px',
  },
  backButton: {
    width: '100%',
    marginTop: '16px',
    padding: '12px',
    background: 'transparent',
    color: '#666',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
  },
  footer: {
    padding: '24px',
    borderTop: '1px solid #f0f0f0',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px',
    color: '#999',
    margin: '0 0 4px 0',
  },
  footerLinks: {
    fontSize: '12px',
    color: '#999',
    margin: 0,
  },
  footerLink: {
    color: '#666',
    textDecoration: 'underline',
    margin: '0 4px',
  },
};

export default LoginPage;
