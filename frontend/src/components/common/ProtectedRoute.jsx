import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  // Wait until auth check completes
  if (loading) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;