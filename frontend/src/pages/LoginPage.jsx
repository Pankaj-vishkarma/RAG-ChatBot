import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { loginUser } from "../api/auth.api";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [showSplash, setShowSplash] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000); // auto clear after 5s

      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const response = await loginUser({
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      const token =
        response?.data?.token ||
        response?.data?.data?.token;

      if (!token) {
        throw new Error("Token not received from server");
      }

      login(token);
      navigate("/dashboard");
    } catch (err) {
      console.log("FULL ERROR:", err);

      if (err.response) {
        const { status, data } = err.response;

        if (data?.message) {
          setError(data.message);
        } else if (status === 401) {
          setError("Invalid email or password.");
        } else if (status === 400) {
          setError("Invalid request. Please check your input.");
        } else if (status >= 500) {
          setError("Server error. Please try again later.");
        } else {
          setError("Login failed. Please try again.");
        }
      } else if (err.request) {
        // Request was sent but no response received
        setError("Server not responding. Please try again.");
      } else {
        // Something else
        setError(err.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-black animate-gradient bg-[length:200%_200%]">

      <AnimatePresence mode="wait">

        {/* 🔥 Splash Screen */}
        {showSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.h1
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl font-bold text-white"
            >
              Welcome to RAG AI 🚀
            </motion.h1>

            <p className="text-gray-300 mt-4 text-sm sm:text-base">
              Intelligent Retrieval Powered Chatbot
            </p>
          </motion.div>
        ) : (

          /* 🔥 Login Card */
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl"
          >
            <h2 className="text-3xl font-bold text-white text-center mb-6">
              Login
            </h2>

            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-red-600/20 border border-red-500/40 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm shadow-md"
                >
                  ⚠ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  className="peer w-full bg-transparent border-b-2 border-gray-400 focus:border-indigo-400 outline-none py-3 text-white transition-all duration-300"
                />
                <label className="
    absolute left-0 text-gray-400 transition-all duration-300
    top-3
    peer-placeholder-shown:top-3
    peer-placeholder-shown:text-base
    peer-focus:-top-3
    peer-focus:text-sm
    peer-focus:text-indigo-400
    peer-not-placeholder-shown:-top-3
    peer-not-placeholder-shown:text-sm
  ">
                  Email
                </label>
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  className="peer w-full bg-transparent border-b-2 border-gray-400 focus:border-indigo-400 outline-none py-3 text-white transition-all duration-300"
                />
                <label className="
    absolute left-0 text-gray-400 transition-all duration-300
    top-3
    peer-placeholder-shown:top-3
    peer-placeholder-shown:text-base
    peer-focus:-top-3
    peer-focus:text-sm
    peer-focus:text-indigo-400
    peer-not-placeholder-shown:-top-3
    peer-not-placeholder-shown:text-sm
  ">
                  Password
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <p className="text-gray-300 text-sm text-center mt-6">
              Don’t have an account?{" "}
              <Link
                to="/register"
                className="text-indigo-400 hover:underline"
              >
                Register here
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;