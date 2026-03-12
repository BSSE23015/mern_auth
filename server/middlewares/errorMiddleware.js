class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
export const ErrorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";
  console.log(err);
  if (err.name === "CastError") {
    // ### When does it happen?
    // When you pass a **wrong/invalid MongoDB ID** in the URL
    const message = `Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  if (err.name === "JsonWebTokenError") {
    // ### When does it happen?
    // When someone sends a **fake or corrupted JWT token**
    const message = `Json Web Token is invalid, Try again.`;
    err = new ErrorHandler(message, 400);
  }

  if (err.name === "TokenExpiredError") {
    // ### When does it happen?
    // When a **valid token** exists but it has **expired** (too old)
    const message = `Json Web Token is expired, Try again.`;
    err = new ErrorHandler(message, 400);
  }

  // CastError         → Wrong MongoDB ID format      🔑
  // JsonWebTokenError → Fake/corrupted token         🪪
  // TokenExpiredError → Real token but expired       ⏰

  if (err.code === 11000) {
    //   ## When Does it Happen?
    // // You have a User model where email must be unique
    // // John already registered with john@gmail.com
    // // John tries to register AGAIN with same email ❌
    const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
    err = new ErrorHandler(message, 400);
  }

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export default ErrorHandler;
