import express from "express";
import {
  loginUser,
  paymentRazorpay,
  registerUser,
  userCredits,
  veifyRazorpay,
} from "../Controllers/userController.js";
import userAuth from "../Middlewares/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/credits", userAuth, userCredits);
userRouter.post("/pay-razor", userAuth, paymentRazorpay);
userRouter.post("/verify-razor", userAuth, veifyRazorpay);
export default userRouter;
