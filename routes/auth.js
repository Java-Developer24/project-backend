import express from 'express';
import passport from 'passport';  // Import passport
import { signup, login, verifyEmail,adminLogin, resendVerificationEmail } from '../controllers/authController.js';
import { validateCaptcha } from '../middleware/authMiddleware.js';
import { loginSignupRateLimiter } from '../middleware/authMiddleware.js'; // Ensure this is imported correctly
const router = express.Router();
import jwt from "jsonwebtoken"
import  {validateAuthRoutes} from "../controllers/authController.js"

// Google Sign-up Route (New User Registration)
router.get(
  '/google/signup',
  passport.authenticate('google-signup', { scope: ['profile', 'email'] })
);

// Google Sign-up Callback
router.get(
  '/google/signup/callback',
  passport.authenticate('google-signup', { failureRedirect: '/signup' }),
  (req, res) => {
    // Generate a new JWT token on successful sign-up, including user ID and email
    const jwtToken = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role,loginType: 'google' }, // Add ID and other user details
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );
    
    req.user.jwtToken = jwtToken;
    req.user.save();
    
    // After successful sign-up, redirect to the user's dashboard with the JWT token
    res.redirect(`${process.env.FRONTEND_URL}/signup?token=${req.user.jwtToken}`);
  }
);

// Google Login Route (Existing User Login)
router.get(
  '/google/login',
  passport.authenticate('google-login', { scope: ['profile', 'email'] })
);

// Google Login Callback
router.get(
  '/google/login/callback',
  passport.authenticate('google-login', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=Please%20sign%20up%20using%20Google%20first`
  }),
  (req, res) => {
    // Generate a new JWT token on successful login, including user ID and email
    const jwtToken = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role,loginType: 'google' }, // Add ID and other user details
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    req.user.jwtToken = jwtToken;
    req.user.save();
    
    // After successful login, redirect the user to their dashboard with the JWT token
    res.redirect(`${process.env.FRONTEND_URL}/signup?token=${req.user.jwtToken}`);
  }
);


router.post('/validateToken', validateAuthRoutes);





router.post('/signup',validateCaptcha,signup);


// Login Route

router.post('/login', login);

router.post("/admin-api/admin-user-login/admin-login",adminLogin)

router.post("/resend-verification-email", resendVerificationEmail);


// Email Verification Route
router.get('/verify-email', verifyEmail);

// Logout Route

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

export default router; // Use `export default` for ES6 syntax
