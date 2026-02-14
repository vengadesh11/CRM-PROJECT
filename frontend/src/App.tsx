import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import DealsPage from './pages/DealsPage';
import DealDetailPage from './pages/DealDetailPage';
import CustomersPage from './pages/CustomersPage';
import CustomFieldsPage from './pages/CustomFieldsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import RolesPage from './pages/RolesPage';
import UsersPage from './pages/UsersPage';
import LandingPage from './pages/LandingPage';
import SubscriptionPage from './pages/SubscriptionPage';

// Protected Route Component
function ProtectedRoute({ children, permission }: { children: React.ReactNode; permission?: string }) {
    const { user, loading, hasPermission } = useAuth();
    const isSuperAdmin = user?.role?.toLowerCase().includes('super admin');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (permission && !isSuperAdmin && !hasPermission(permission)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

function App() {
    return (
        <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected Routes */}
                    <Route path="/dashboard" element={<ProtectedRoute permission="dashboard.view"><DashboardPage /></ProtectedRoute>} />
                    <Route path="/leads" element={<ProtectedRoute permission="leads.view"><LeadsPage /></ProtectedRoute>} />
                    <Route path="/leads/:id" element={<ProtectedRoute permission="leads.view"><LeadDetailPage /></ProtectedRoute>} />
                    <Route path="/deals" element={<ProtectedRoute permission="deals.view"><DealsPage /></ProtectedRoute>} />
                    <Route path="/deals/:id" element={<ProtectedRoute permission="deals.view"><DealDetailPage /></ProtectedRoute>} />
                    <Route path="/customers" element={<ProtectedRoute permission="customers.view"><CustomersPage /></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute permission="users.view"><UsersPage /></ProtectedRoute>} />
                    <Route path="/departments" element={<ProtectedRoute permission="departments.view"><DepartmentsPage /></ProtectedRoute>} />
                    <Route path="/roles" element={<ProtectedRoute permission="roles.view"><RolesPage /></ProtectedRoute>} />
                    <Route path="/custom-fields" element={<ProtectedRoute permission="settings.view"><CustomFieldsPage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute permission="settings.view"><CustomFieldsPage /></ProtectedRoute>} />

                    {/* Default Route */}
                    <Route path="/subscription" element={<SubscriptionPage />} />
                    <Route path="/" element={<LandingPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
