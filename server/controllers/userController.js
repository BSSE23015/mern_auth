import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncError } from "../middlewares/catchasyncError.js";
import { User } from "../models/userModel.js";
import sendEmail from "../utils/sendEmail.js";

export const registerUser = catchAsyncError(async (req, res, next) => {
  try {
    const { name, email, password, phone, verificationMethod } = req.body;
    if (!name || !email || !password || !phone || !verificationMethod) {
      return next(new ErrorHandler("Please fill all the fields", 400));
    }
    function validatePhoneNumber(phone) {
      const phoneRegex = /^\+923\d{9}$/;
      return phoneRegex.test(phone);
    }
    if (!validatePhoneNumber(phone)) {
      return next(
        new ErrorHandler(
          "Invalid phone number format. It should start with +923 followed by 9 digits.",
          400,
        ),
      );
    }
    const isExistingUser = await User.findOne({
      $or: [
        {
          email,
          accountVerified: true,
        },
        {
          phone,
          accountVerified: true,
        },
      ],
    });
    if (isExistingUser) {
      return next(
        new ErrorHandler(
          "User already exists with this email or phone number",
          400,
        ),
      );
    }

    const registrationAttemptsByUser = await User.find({
      $or: [
        { email, accountVerified: false },
        { phone, accountVerified: false },
      ],
    });
    if (registrationAttemptsByUser.length > 3) {
      return next(
        new ErrorHandler(
          "Too many registration attempts. Please try again after an hour",
          400,
        ),
      );
    }
    const userData = {
      name,
      email,
      password,
      phone,
    };
    const newUser = new User(userData);
    const verificationCode = newUser.generateVerificationCode();
    await newUser.save();
    sendVerificationCode(
      verificationMethod,
      email,
      name,
      phone,
      verificationCode,
      res,
    );
  } catch (error) {
    next(error);
  }
});

function sendVerificationCode(
  verificationMethod,
  email,
  name,
  phone,
  verificationCode,
  res,
) {
  try {
    if (verificationMethod === "email") {
      const message = generateEmailTemplate(verificationCode);
      sendEmail({ email, subject: "Your Verification Code", message });
      res.status(200).json({
        success: true,
        message: `Verification email sent successfully to ${name}.`,
      });
    } else if (verificationMethod === "phone") {
      // Implement SMS sending logic here using an SMS service provider like Twilio or Nexmo
      const verificationCodeWithSpace = verificationCode
        .toString() //convert number otp to string
        .split("") //split the string into an array of individual characters
        .join(" "); //join the array back into a string with spaces between each character

      console.log(
        `Sending SMS to ${phone} with verification code: ${verificationCodeWithSpace}`,
      );
      res.status(200).json({
        success: true,
        message: `Verification SMS sent successfully to ${name}.`,
      });
    } else {
      throw new ErrorHandler("Invalid verification method", 400);
    }
  } catch (error) {
    throw error;
  }
}
function generateEmailTemplate(verificationCode) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#f4f4f4; font-family: Arial, sans-serif;">

  <div style="max-width:500px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg, #667eea, #764ba2); padding:40px 30px; text-align:center;">
      <h1 style="color:white; font-size:26px; margin:0;">
        Verify Your Email ✉️
      </h1>
      <p style="color:rgba(255,255,255,0.85); font-size:14px; margin-top:8px;">
        One step away from getting started!
      </p>
    </div>

    <div style="padding:36px 30px; text-align:center;">
      <p style="color:#555; font-size:15px; margin-bottom:24px;">
        Use the verification code below to confirm your email:
      </p>

      <div style="display:inline-block; background:#f0f0ff; border:2px dashed #667eea; border-radius:12px; padding:16px 40px; font-size:36px; font-weight:800; letter-spacing:8px; color:#667eea; margin-bottom:24px;">
        ${verificationCode}
      </div>

      <p style="color:#e74c3c; font-size:13px; margin-bottom:16px;">
        ⏰ This code expires in 10 minutes
      </p>

      <p style="color:#aaa; font-size:13px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>

    <div style="background:#f9f9f9; padding:20px 30px; text-align:center; border-top:1px solid #eee;">
      <p style="color:#aaa; font-size:12px;">
        &copy; 2024 YourAppName. All rights reserved.
      </p>
    </div>
  </div>

</body>
</html>
  `;
}
