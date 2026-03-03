import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { registerUser } from "../api/auth.api";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* Auto clear error after 5 sec */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
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
      await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      navigate("/");
    } catch (err) {
      if (!err.response) {
        setError("Network error. Please check your internet connection.");
      } else {
        const { status, data } = err.response;

        if (typeof data === "string") {
          setError(data);
        } else if (data?.message && typeof data.message === "string") {
          setError(data.message);
        } else if (Array.isArray(data?.errors)) {
          setError(data.errors.map(e => e.msg || e.message).join(", "));
        } else if (status === 400) {
          setError("Invalid input. Please check your details.");
        } else if (status >= 500) {
          setError("Server error. Please try again later.");
        } else {
          setError("Registration failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-black animate-gradient bg-[length:200%_200%]">

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl"
      >
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Create Account
        </h2>

        {/* Animated Error */}
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

          {/* Name */}
          <div className="relative">
            <input
              type="text"
              name="name"
              placeholder=" "
              required
              value={formData.name}
              onChange={handleChange}
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
              Full Name
            </label>
          </div>

          {/* Email */}
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder=" "
              required
              value={formData.email}
              onChange={handleChange}
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
              placeholder=" "
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
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

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Creating Account...
              </span>
            ) : (
              "Register"
            )}
          </button>
        </form>

        <p className="text-gray-300 text-sm text-center mt-6">
          Already have an account?{" "}
          <Link to="/" className="text-indigo-400 hover:underline">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;