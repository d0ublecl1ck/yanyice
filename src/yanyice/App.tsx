
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CaseEditPage } from './pages/cases/CaseEditPage';
import { CaseListPage } from './pages/cases/CaseListPage';
import { CustomerListPage } from './pages/customers/CustomerListPage';
import { CustomerEditPage } from './pages/customers/CustomerEditPage';
import { CustomerHistoryPage } from './pages/customers/CustomerHistoryPage';
import { RulePage } from './pages/rules/RulePage';
import { ExportPage } from './pages/export/ExportPage';
import { SettingsPage } from './pages/settings/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        {/* Customer Routes */}
        <Route path="/customers" element={
          <ProtectedRoute>
            <CustomerListPage />
          </ProtectedRoute>
        } />
        <Route path="/customers/new" element={
          <ProtectedRoute>
            <CustomerEditPage />
          </ProtectedRoute>
        } />
        <Route path="/customers/edit/:id" element={
          <ProtectedRoute>
            <CustomerEditPage />
          </ProtectedRoute>
        } />
        <Route path="/customers/history/:id" element={
          <ProtectedRoute>
            <CustomerHistoryPage />
          </ProtectedRoute>
        } />

        {/* Case Routes */}
        <Route path="/cases" element={
          <ProtectedRoute>
            <CaseListPage />
          </ProtectedRoute>
        } />
        <Route path="/cases/new" element={
          <ProtectedRoute>
            <CaseEditPage />
          </ProtectedRoute>
        } />
        <Route path="/cases/edit/:id" element={
          <ProtectedRoute>
            <CaseEditPage />
          </ProtectedRoute>
        } />

        {/* Other Functional Routes */}
        <Route path="/rules" element={
          <ProtectedRoute>
            <RulePage />
          </ProtectedRoute>
        } />

        <Route path="/export" element={
          <ProtectedRoute>
            <ExportPage />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
