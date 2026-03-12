export const catchAsyncError = (theFunction) => {
  return (req, res, next) => {
    Promise.resolve(theFunction(req, res, next)).catch(next);
    //                                                    ↑
    //                                          HERE is where error is passed!
  };
};

// // .catch(next) is same as writing this:
// .catch((err) => {
//     next(err)  // ← err is being passed into next!
// //       ↑
// //  Express sees something passed in
// //  JUMPS to 4 param middleware!
// })







// // 1. your controller throws an error
// const user = await User.findById(id)  // ← something goes wrong!

// // 2. Promise catches it
// Promise.resolve(theFunction()).catch(next)
// //                              ↑
// //                        catch grabs the error
// //                        passes it into next(err)

// // 3. Express sees next(err)
// // "something passed into next!"
// // SKIP all 3 param middlewares
// // FIND 4 param middleware

// // 4. Lands in YOUR ErrorMiddleware
// export const ErrorMiddleware = (err, req, res, next) => {
// //                              ↑
// //                         receives the error here!
//     res.status(err.statusCode).json({
//         success: false,
//         message: err.message
//     })
// }
// ```

// ---

// ## The Complete Journey
// ```
// controller fails
//       ↓
// .catch(next)  →  next(err) called
//       ↓
// Express sees "err passed in!"
//       ↓
// SKIPS cors, json, cookieParser
//       ↓
// FINDS ErrorMiddleware (4 params)
//       ↓
// sends { success: false, message: "..." }
// to frontend ✅
