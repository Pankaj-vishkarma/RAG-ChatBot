const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./auth.model");

const registerUser = async (data) => {
  const { name, email, password } = data;

  if (!name || !email || !password) {
    const error = new Error("All fields are required");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error("Password must be at least 6 characters");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("Email already exists");
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12); // stronger hashing

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};

const loginUser = async (data) => {
  const { email, password } = data;

  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT secret not configured");
    error.statusCode = 500;
    throw error;
  }

  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 400;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.statusCode = 400;
    throw error;
  }

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    }
  );

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    token,
  };
};

module.exports = {
  registerUser,
  loginUser,
};