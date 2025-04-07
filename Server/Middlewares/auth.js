import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization; // Use 'authorization' header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Not Authorized, Login Again" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token after 'Bearer'
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.id) {
      req.userId = decoded.id; // Attach userId to the request body
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Not Authorized, Login Again" });
    }
    next();
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "Not Authorized, Login Again" });
  }
};

export default userAuth;