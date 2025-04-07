import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not Authorized , Login Again" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.id) {
      req.body.userId = decoded.id;
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Not Authorized , Login Again" });
    }
    next();
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "Not Authorized , Login Again " });
  }
};

export default userAuth;
