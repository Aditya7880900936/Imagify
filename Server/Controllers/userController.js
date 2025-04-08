import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../Models/userModel.js";
import razorpay from "razorpay";
import dotenv from "dotenv";
import transactionModel from "../Models/transactionModel.js";
dotenv.config();
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    if (!email.includes("@")) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userData = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    // const newUser = new userModel(userData);
    // const user = await newUser.save();
    const token = jwt.sign({ id: userData._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({ success: true, user: { name: userData.name }, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({ success: true, user: { name: user.name }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const userCredits = async (req, res) => {
  try {
    const userId = req.userId; // Extracted from the request body by the auth middleware
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID not found" });
    }

    const user = await userModel.findById(userId);
    res.json({
      success: true,
      credits: user.creditBalance,
      user: {
        id: user._id,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentRazorpay = async (req, res) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ success: false, message: "Please provide all details" });
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let credits, amount, plan, date;
    switch (planId) {
      case "Basic":
        credits = 100;
        amount = 10;
        plan = "Basic Plan";
        date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        break;
      case "Advanced":
        credits = 500;
        amount = 50;
        plan = "Advanced Plan";
        date = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        break;
      case "Business":
        credits = 5000;
        amount = 250;
        plan = "Business Plan";
        date = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid plan ID" });
    }

    const transactionData = {
      userId: userId,
      credits: credits,
      amount: amount,
      plan: plan,
      date: date,
    };

    const newTransaction = await transactionModel.create(transactionData);

    // 👇 Razorpay expects integer amount in paisa (INR). 10 * 100 = ₹10.00
    const order = await razorpayInstance.orders.create({
      amount: amount * 100, 
      currency: process.env.CURRENCY || "INR", // fallback to INR
      receipt: String(newTransaction._id),
    });

    return res.json({ success: true, order });

  } catch (error) {
    console.error("💥 Razorpay Payment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const veifyRazorpay = async(req,res)=>{
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
    if (!orderInfo) {
      return res.status(404).json({ success: false, message: "Order not found" });
    } 
    if(orderInfo.status === "paid") {
      const transactionData = await transactionModel.findById(orderInfo.receipt);
      if(transactionData.payment){
        return res.status(400).json({ success: false, message: "Payment Failed" });
      }

      const userData = await userModel.findById(transactionData.userId);

      const creditBalance = userData.creditBalance + transactionData.credits;
       await userModel.findByIdAndUpdate(userData._id, {
        creditBalance: creditBalance,
      });
      await transactionModel.findByIdAndUpdate(transactionData._id, {
        payment: true,
        date: transactionData.date,
      });
      return res.json({ success: true, message: "Payment successful"});
    }
    else{
      return res.status(400).json({ success: false, message: "Payment failed" });
    }

  } catch (error) {
    console.error("💥 Razorpay Verification Error:", error);
    res.status(500).json({ success: false, message: error.message });
    
  }
}

export { registerUser, loginUser, userCredits, paymentRazorpay , veifyRazorpay };