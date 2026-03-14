import mongoose from "mongoose";
import bcrypt from "bcrypt";

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

export const User = mongoose.model("User", userSchema);
