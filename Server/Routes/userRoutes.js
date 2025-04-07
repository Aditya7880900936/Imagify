import express from "express";
import {
  loginUser,
  registerUser,
  userCredits,
} from "../Controllers/userController.js";
import userAuth from "../Middlewares/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/credits", userAuth, userCredits);

export default userRouter;
