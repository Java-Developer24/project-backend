import mongoose from 'mongoose';



const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId; // Password required if Google ID is not present
    },
  },
  googleId: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  balance: {
    type: Number,
    default: 0, // Initial balance is 0 for all users
  },
  discount: {
    type: Number, // Stores discount percentage (e.g., 10 for 10%)
    default: null,
  },
  blocked_reason: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'blocked', 'inactive'], // Blocked users cannot access services
    default: 'active',
  },
 isVerified: {
    type: Boolean, default: false }, // Email verification status
  trxWalletAddress: { 
    type: String, default: null }, // TRX wallet address
  trxPrivateKey: { 
    type: String, default: null },    // TRX private key
  jwtToken: {
      type: String,
      default: null, // Store the latest JWT token
    },
  apiKey: {
      type: String,
      default: null, // Store unique API key for accessing APIs
    },
    rechargeHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RechargeHistory', // References the Recharge model
    },
  ],
  orderHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NumberHistory', // References the Order model
    },
   
  ],
  ipAddress: { type: String, default: null }, // New field to store IP address
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
export default User;
