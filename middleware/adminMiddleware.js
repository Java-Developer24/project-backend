import jwt from 'jsonwebtoken';
import Admin from '../models/mfa.js'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET

export const authenticateToken = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token from "Authorization: Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied: No token provided' });
  }

  try {
    // Verify the token
    const verified = jwt.verify(token, JWT_SECRET);

    // Check if the token exists in the database
    const admin = await Admin.findOne({ _id: verified.id, token });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Attach the admin data to the request object
    req.admin = admin;
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error(err);
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};
