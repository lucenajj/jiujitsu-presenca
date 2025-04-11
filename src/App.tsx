import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClassesList from "./pages/ClassesList";
import AttendanceRecord from "./pages/AttendanceRecord";
import AttendanceList from "./pages/AttendanceList";
import StudentsList from "./pages/StudentsList";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import { AuthProvider, useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

// Componente para rotas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

// Componente para rotas que requerem permissão de administrador
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  // Verificar se o usuário é admin (por role ou por email específico)
  const isAdmin = user?.role === 'admin' || user?.email === 'lucenajj@gmail.com';
  
  console.log('AdminRoute - verificação:', { 
    email: user?.email, 
    role: user?.role, 
    isAdmin 
  });
  
  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// Redirecionamento para usuários já autenticados
const RedirectIfAuthenticated = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={
      <RedirectIfAuthenticated>
        <Login />
      </RedirectIfAuthenticated>
    } />
    
    <Route element={
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    }>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/classes" element={<ClassesList />} />
      <Route path="/students" element={<StudentsList />} />
      <Route path="/attendance" element={<AttendanceList />} />
      <Route path="/attendance/record/:classId" element={<AttendanceRecord />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={
        <AdminRoute>
          <Settings />
        </AdminRoute>
      } />
    </Route>
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
          <Sonner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
