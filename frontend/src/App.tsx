import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navigation } from "@/components/layout/Navigation";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { InvestPage } from "@/pages/InvestPage";
import { MyInvestmentsPage } from "@/pages/MyInvestmentsPage";
import { UpdatesPage } from "@/pages/UpdatesPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthorizedRoute } from "@/components/auth/AuthorizedRoute";
import { AccountStatusPage } from "@/pages/AccountStatusPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import OfferingsManagement from "@/pages/admin/OfferingsManagement";
import CreateOffering from "@/pages/admin/CreateOffering";
import EditOffering from "@/pages/admin/EditOffering";
import UserManagement from "@/pages/admin/UserManagement";
import AdminDocuments from "@/pages/admin/AdminDocuments";
import AdminCompliance from "@/pages/admin/AdminCompliance";
import CapitalCallsManagement from "@/pages/admin/CapitalCallsManagement";
import CreateCapitalCall from "@/pages/admin/CreateCapitalCall";
import { OfferingDetailsPage } from "@/pages/OfferingDetailsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Toaster />
            <Sonner />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invest"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <InvestPage />
                  </ProtectedRoute>
                }
               />
               <Route
                 path="/invest/offerings/:id"
                 element={
                   <ProtectedRoute>
                     <OfferingDetailsPage />
                   </ProtectedRoute>
                 }
               />
               <Route
                 path="/my-investments"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <MyInvestmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/updates"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <UpdatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <TransactionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <DocumentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profiles"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <div className="container mx-auto p-6">
                      <h1 className="text-3xl font-bold">Profiles</h1>
                      <p className="text-muted-foreground mt-2">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <div className="container mx-auto p-6">
                      <h1 className="text-3xl font-bold">Account Settings</h1>
                      <p className="text-muted-foreground mt-2">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sharing"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <div className="container mx-auto p-6">
                      <h1 className="text-3xl font-bold">Sharing</h1>
                      <p className="text-muted-foreground mt-2">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/email-preferences"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <div className="container mx-auto p-6">
                      <h1 className="text-3xl font-bold">Email Preferences</h1>
                      <p className="text-muted-foreground mt-2">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account-status"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <AccountStatusPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AuthorizedRoute requiredRole="admin">
                    <Navigation />
                    <AdminDashboard />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="/admin/offerings"
                element={
                  <AuthorizedRoute requiredRole="admin">
                    <Navigation />
                    <OfferingsManagement />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="/admin/offerings/create"
                element={
                  <AuthorizedRoute requiredRole="admin">
                    <Navigation />
                    <CreateOffering />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="/admin/offerings/:id/edit"
                element={
                  <AuthorizedRoute requiredRole="admin">
                    <Navigation />
                    <EditOffering />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AuthorizedRoute requiredRole="admin">
                    <Navigation />
                    <UserManagement />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="/admin/documents"
                element={
                  <AuthorizedRoute requiredRole="admin">
                    <Navigation />
                    <AdminDocuments />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="/admin/compliance"
                element={
                  <AuthorizedRoute requiredRole="admin">
                    <Navigation />
                    <AdminCompliance />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="/admin/capital-calls"
                element={
                  <AuthorizedRoute requiredRole="admin">
                    <Navigation />
                    <CapitalCallsManagement />
                  </AuthorizedRoute>
                }
              />
              <Route
                path="/admin/capital-calls/create"
                element={
                  <AuthorizedRoute requiredRole="admin">
                    <Navigation />
                    <CreateCapitalCall />
                  </AuthorizedRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;