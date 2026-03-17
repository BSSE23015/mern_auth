import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncError } from "../middlewares/catchasyncError.js";
import { User } from "../models/userModel.js";
import sendEmail from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";

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

export const verifyotp = catchAsyncError(async (req, res, next) => {
  const { email, otp, phone } = req.body;
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
  try {
    const userAllEntries = await User.find({
      $or: [
        { email, accountVerified: false },
        { phone, accountVerified: false },
      ],
    }).sort({ createdAt: -1 }); // Sort by creation date in descending order
    //     With .sort({ createdAt: -1 }) ✅ newest first
    // User attempt 3 → createdAt: 5:20pm  ← first
    // User attempt 2 → createdAt: 5:10pm
    // User attempt 1 → createdAt: 5:00pm  ← last

    if (!userAllEntries) {
      return next(
        new ErrorHandler(
          "No registration attempt found for this email or phone number",
          400,
        ),
      );
    }
    let user;
    if (userAllEntries.length > 1) {
      user = userAllEntries[0]; // Get the most recent registration attempt
      await User.deleteMany({
        _id: { $ne: user._id }, // Delete all other attempts except the most recent one
        $or: [
          { phone, accountVerified: false },
          { email, accountVerified: false },
        ],
      });
    } else {
      user = userAllEntries[0];
    }
    if (user.verificationCode != Number(otp)) {
      return next(new ErrorHandler("Invalid OTP", 400));
    }
    const currentTime = Date.now();
    // Date.now() returns current time in milliseconds
    // example: 1714500000000

    const verificationCodeExpire = new Date(
      user.verificationCodeExpire,
    ).getTime();
    // user.verificationCodeExpire is a Date object stored in DB
    // new Date() converts it to a JavaScript Date object
    // .getTime() converts it to milliseconds so we can compare it with currentTime
    // example: 1714500300000

    // WHY milliseconds?
    // currentTime > verificationCodeExpire → OTP expired ❌
    // currentTime < verificationCodeExpire → OTP still valid ✅
    if (currentTime > verificationCodeExpire) {
      return next(
        new ErrorHandler("OTP has expired. Please register again.", 400),
      );
    }
    user.accountVerified = true;
    // OTP was correct → mark user as verified ✅

    user.verificationCode = null;
    // delete the OTP code from DB
    // its useless now, no need to keep it! 🗑️

    user.verificationCodeExpire = null;
    // delete the expiry time too
    // also useless now! 🗑️

    await user.save({ validateModifiedOnly: true });
    // save these changes to DB
    // verificationCode is type: Number in schema
    // but you set it to null
    // if mongoose validates ALL fields → ERROR! ❌

    // with validateModifiedOnly: true
    // mongoose only checks what changed
    // and null is acceptable for optional fields ✅

    sendToken(user, 200, "User registered and verified successfully", res);
  } catch (error) {
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Invalid email or password", 400));
  }
  const user = await User.findOne({ email, accountVerified: true }).select(
    "+password",
  ); //we need to select password here because in user schema, we set select: false for password field for security reasons. So by default, when we query the user, the password field is not included in the result. But during login, we need to compare the provided password with the hashed password stored in the database. To do that, we need to explicitly include the password field in our query result using .select("+password").
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 400));
  }
  let isCorrectPassword = await user.comparePassword(password);
  if (!isCorrectPassword) {
    return next(new ErrorHandler("Invalid email or password", 400));
  } else {
    sendToken(user, 200, "Login successful", res);
  }
});
export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("authToken", null, {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});

export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = req.user; //req.user is set in the isAuthenticated middleware after verifying the JWT token and fetching the user's information from the database. So when a request is made to this route, it will have access to the authenticated user's information through req.user.
  res.status(200).json({
    success: true,
    user,
  });
});
