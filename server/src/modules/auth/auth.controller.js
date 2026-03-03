const authService = require("./auth.service");
const { validateRegister, validateLogin } = require("./auth.validation");

const register = async (req, res, next) => {
  try {
    validateRegister(req.body);

    const user = await authService.registerUser(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    validateLogin(req.body);

    const result = await authService.loginUser(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
};