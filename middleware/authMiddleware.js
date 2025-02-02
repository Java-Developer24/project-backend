import axios from "axios";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";

export const validateCaptcha = async (req, res, next) => {
  const captchaToken = req.body.captcha; // The token sent from frontend

  if (!captchaToken) {
    return res.status(400).json({ message: "Captcha is required." });
  }

  const secretKey = "0x4AAAAAAA7JkWFceZas3LLLE-6qJWuzZ-M";

  try {
    // Create a URLSearchParams object to encode the data as x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append("secret", secretKey);
    params.append("response", captchaToken);

    // Sending POST request with URLSearchParams
    const response = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      params.toString(), // Use .toString() to ensure correct format
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // Ensure the correct content type
        },
      }
    );

    // Handle Cloudflare's response
    // Check if CAPTCHA verification succeeded
    if (!response.data.success) {
      return res.status(400).json({
        message: "Invalid CAPTCHA verification.",
        errors: response.data["error-codes"],
      });
    }

    next(); // Proceed to the next middleware/controller
  } catch (error) {
    console.error(
      "Captcha verification error:",
      error.response?.data || error.message
    );
    return res.status(500).json({ message: "Captcha verification failed." });
  }
};

export const loginSignupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 10, // Limit each IP to 10 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

export const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    console.log(token);

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token." });
  }
};
