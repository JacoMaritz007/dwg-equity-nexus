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
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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
                path="/my-investments"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <div className="container mx-auto p-6">
                      <h1 className="text-3xl font-bold">My Investments</h1>
                      <p className="text-muted-foreground mt-2">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/updates"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <div className="container mx-auto p-6">
                      <h1 className="text-3xl font-bold">Updates</h1>
                      <p className="text-muted-foreground mt-2">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <div className="container mx-auto p-6">
                      <h1 className="text-3xl font-bold">Transactions</h1>
                      <p className="text-muted-foreground mt-2">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <div className="container mx-auto p-6">
                      <h1 className="text-3xl font-bold">Documents</h1>
                      <p className="text-muted-foreground mt-2">Coming soon...</p>
                    </div>
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