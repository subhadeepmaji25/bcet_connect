//backend/src/shared/utils/passwordValidator.js
const COMMON_WEAK_PASSWORDS = [
  "password",
  "password123",
  "admin",
  "admin123",
  "qwerty",
  "qwerty123",
  "12345678",
  "123456789",
  "abc123",
  "welcome",
  "letmein"
];

const validatePassword = (
  password
) => {

  if (!password) {
    throw new Error(
      "Password is required"
    );
  }

  if (
    typeof password !==
    "string"
  ) {
    throw new Error(
      "Password must be a string"
    );
  }

  const normalizedPassword =
    password.trim();

  if (
    normalizedPassword.length < 8
  ) {
    throw new Error(
      "Password must be at least 8 characters long"
    );
  }

  if (
    normalizedPassword.length > 50
  ) {
    throw new Error(
      "Password cannot exceed 50 characters"
    );
  }

  if (
    /\s/.test(
      normalizedPassword
    )
  ) {
    throw new Error(
      "Password cannot contain spaces"
    );
  }

  if (
    COMMON_WEAK_PASSWORDS.includes(
      normalizedPassword.toLowerCase()
    )
  ) {
    throw new Error(
      "Password is too common"
    );
  }

  if (
    !/[A-Z]/.test(
      normalizedPassword
    )
  ) {
    throw new Error(
      "Password must contain at least one uppercase letter"
    );
  }

  if (
    !/[a-z]/.test(
      normalizedPassword
    )
  ) {
    throw new Error(
      "Password must contain at least one lowercase letter"
    );
  }

  if (
    !/\d/.test(
      normalizedPassword
    )
  ) {
    throw new Error(
      "Password must contain at least one number"
    );
  }

  if (
    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
      normalizedPassword
    )
  ) {
    throw new Error(
      "Password must contain at least one special character"
    );
  }

  return true;
};

module.exports =
  validatePassword;