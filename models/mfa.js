import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  twoFASecret: { type: String, default: null }, // For storing 2FA secret
  is2FAEnabled: { type: Boolean, default: false }, // To check if 2FA is enabled
  adminIp: { type: String, default: null }, // For storing admin IP
  token: { type: String }, // Store the most recent JWT token
  checkOtp:{type:Boolean,default:false}
}, { timestamps: true });

const Admin = mongoose.model('Admin', AdminSchema);
export default Admin;
