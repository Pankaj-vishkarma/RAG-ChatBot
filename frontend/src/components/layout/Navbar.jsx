import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";

const Navbar = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="w-full flex justify-between items-center px-4 sm:px-6 py-4 
    bg-white/5 backdrop-blur-xl border-b border-white/10 
    shadow-lg">

      {/* Logo / Title */}
      <h1 className="text-base sm:text-lg font-semibold tracking-wide text-white">
        RAG Chatbot
      </h1>

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 
        px-4 py-2 rounded-lg text-sm sm:text-base 
        transition-all duration-300 hover:scale-105 shadow-md"
      >
        Logout
      </Button>
    </div>
  );
};

export default Navbar;