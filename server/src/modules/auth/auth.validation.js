const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateRegister = (data) => {
  const { name, email, password } = data;

  // Required fields
  if (!name || !email || !password) {
    throw createError("All fields are required");
  }

  // Name validation
  if (typeof name !== "string" || !name.trim()) {
    throw createError("Name is required");
  }

  // Email validation
  if (typeof email !== "string" || !email.trim()) {
    throw createError("Email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw createError("Please provide a valid email address");
  }

  // Password validation
  if (typeof password !== "string" || !password.trim()) {
    throw createError("Password is required");
  }

  if (password.trim().length < 6) {
    throw createError("Password must be at least 6 characters");
  }
};

const validateLogin = (data) => {
  const { email, password } = data;

  if (!email || !password) {
    throw createError("Email and password are required");
  }

  if (typeof email !== "string" || !email.trim()) {
    throw createError("Email is required");
  }

  if (typeof password !== "string" || !password.trim()) {
    throw createError("Password is required");
  }
};

module.exports = {
  validateRegister,
  validateLogin,
};