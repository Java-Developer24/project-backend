import jwt from 'jsonwebtoken';
import Admin from '../models/mfa.js';  // Assuming the `Admin` model contains `apiAdminIp`
const JWT_SECRET = process.env.ADMIN_JWT_SECRET;

export const authenticateToken = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token from "Authorization: Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied: No token provided' });
  }

  try {
// Extract IP from 'X-Forwarded-For' (Cloudflare and others)
let ip = req.headers['x-forwarded-for'] 
    ? req.headers['x-forwarded-for'].split(',').pop().trim() // Get the last IP from the chain
    : req.connection.remoteAddress; // Fallback if header doesn't exist

// Normalize IPv6 if necessary
if (ip.startsWith('::ffff:')) {
    ip = ip.split('::ffff:')[1];  // Convert IPv6-mapped IPv4 to pure IPv4
}

console.log("Client IP:", ip);  // Log the real client IP (IPv6 or IPv4)
req.clientIp = ip;  // Store the IP in req.clientIp

 
      
req.clientIp = ip;
  
    console.log("middlewareip",ip)

    // Step 2: Fetch the `apiAdminIp` from the Admin collection
    const admin = await Admin.findOne({ /* Your query to identify the admin */ });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const apiAdminIp = admin.apiAdminIp; // Assuming `apiAdminIp` is stored in the Admin model

    // Step 3: Compare the Request IP with the `apiAdminIp`
    if (req.clientIp !== apiAdminIp) {
      return res.status(403).json({ success: false, message: 'Access Denied: IP not authorized' });
    }

    // Step 4: Verify the token
    const verified = jwt.verify(token, JWT_SECRET);

    // Check if the token exists in the database
    const validAdmin = await Admin.findOne({ _id: verified.id, token });
    if (!validAdmin) {
      return res.status(401).json({ success: false, message: '  token expired : Please login ' });
    }

    // Attach the admin data to the request object
    req.admin = validAdmin;

    // Step 5: Proceed to the next middleware or route handler
    next();
  } catch (err) {
    console.error(err);
    return res.status(403).json({ success: false, message: 'token expired : Please login ' });
  }
};
