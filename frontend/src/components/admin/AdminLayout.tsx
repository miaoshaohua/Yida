import React from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div style={styles.layout}>
      <AdminSidebar />
      <div style={styles.mainContainer}>
        <AdminHeader />
        <main style={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  layout: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  mainContainer: {
    marginLeft: '260px',
    minHeight: '100vh',
  },
  content: {
    padding: '88px 24px 24px',
    minHeight: 'calc(100vh - 112px)',
  },
};
