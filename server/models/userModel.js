import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    minLength: [6, "Password must be at least 6 characters long"],
    maxLength: [32, "Password cannot exceed 32 characters"],
    select: false, // Exclude the password field from query results by default for security reasons. This means that when you fetch a user from the database, the password will not be included in the returned data unless you explicitly request it.
  },
  phone: {
    type: String,
    unique: true,
  },
  accountVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: Number,
  verificationCodeExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return; //if password is not modified, then skip hashing and move to next middleware or save operation
  }
  this.password = await bcrypt.hash(this.password, 10); //hash the password with a salt round of 10 before saving it to the database. This ensures that the password is stored securely and not in plain text.
  // next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password); //compare the provided password with the hashed password stored in the database. It returns true if the passwords match and false otherwise. This method is used during login to verify the user's credentials.
};

userSchema.methods.generateVerificationCode = function () {
  const generateRandomFiveDigitCode = () => {
    const firstDigit = Math.floor(Math.random() * 9 + 1); // Generate the first digit (1-9)
    const remainingDigits = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0"); // Generate the remaining 4 digits (0000-9999) and pad with leading zeros if necessary

    return parseInt(firstDigit + remainingDigits);
  };
  const verificationCode = generateRandomFiveDigitCode();
  this.verificationCode = verificationCode;
  this.verificationCodeExpire = Date.now() + 5 * 60 * 1000; // Set the verification code to expire in 5 minutes
  return verificationCode;
};

userSchema.methods.generateToken = async function () {
  return await jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex"); // Generate a random token using crypto library. This token will be used to identify the password reset request.

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex"); // Hash the reset token using SHA-256 algorithm and store it in the database. This ensures that even if someone gains access to the database, they won't be able to see the actual reset token.
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Set the reset token to expire in 10 minutes. This adds an extra layer of security by ensuring that the token cannot be used indefinitely.
  return resetToken; // Return the original reset token (not the hashed version) so that it can be sent to the user's email for password reset.
};
export const User = mongoose.model("User", userSchema);
