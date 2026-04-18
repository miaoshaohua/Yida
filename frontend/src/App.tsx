import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import { TryOnPage } from './pages/TryOnPage'
import { LoadingPage } from './pages/LoadingPage'
import { ResultPage } from './pages/ResultPage'
import { HistoryPage } from './pages/HistoryPage'
import { MyPage } from './pages/MyPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminTryOnPage } from './pages/admin/AdminTryOnPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminPhotosPage } from './pages/admin/AdminPhotosPage'
import { AdminConfigsPage } from './pages/admin/AdminConfigsPage'
import { AdminAccountsPage } from './pages/admin/AdminAccountsPage'
import { AdminLogsPage } from './pages/admin/AdminLogsPage'
import { AdminApiLogsPage } from './pages/admin/AdminApiLogsPage'
import './App.css'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>加载中...</div>
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, loading } = useAdminAuth()
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>加载中...</div>
  }
  
  return admin ? (
    <>{children}</>
  ) : (
    <Navigate to="/admin/login" replace />
  )
}

function AppContent() {
  const { loading } = useAuth()
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>加载中...</div>
  }
  
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/tryon" element={
          <ProtectedRoute>
            <TryOnPage />
          </ProtectedRoute>
        } />
        <Route path="/loading/:taskId" element={
          <ProtectedRoute>
            <LoadingPage />
          </ProtectedRoute>
        } />
        <Route path="/result/:taskId" element={
          <ProtectedRoute>
            <ResultPage />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        } />
        <Route path="/my" element={
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <AdminProtectedRoute>
            <AdminUsersPage />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/tryon" element={
          <AdminProtectedRoute>
            <AdminTryOnPage />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <AdminProtectedRoute>
            <AdminOrdersPage />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/photos" element={
          <AdminProtectedRoute>
            <AdminPhotosPage />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/configs" element={
          <AdminProtectedRoute>
            <AdminConfigsPage />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/accounts" element={
          <AdminProtectedRoute>
            <AdminAccountsPage />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/logs" element={
          <AdminProtectedRoute>
            <AdminLogsPage />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/api-logs" element={
          <AdminProtectedRoute>
            <AdminApiLogsPage />
          </AdminProtectedRoute>
        } />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <AppContent />
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
