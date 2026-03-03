import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/LoginPage";
import Register from "./pages/Register";
import Dashboard from "./pages/DashboardPage";

import ProtectedRoute from "./components/common/ProtectedRoute";
import PublicRoute from "./components/common/PublicRoute";

import AuthProvider from "./context/AuthContext";
import ChatProvider from "./context/ChatContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <Routes>
            {/* Public Routes (Blocked if logged in) */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected Route */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Login />} />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;