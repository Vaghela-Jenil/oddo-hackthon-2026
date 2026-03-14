/**
 * Simple Password Validator
 * Requirements:
 * - Minimum 6 characters
 * - At least one letter OR number
 */

const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!/[a-zA-Z0-9]/.test(password)) {
    errors.push("Password must contain at least one letter or number");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = { validatePassword };
