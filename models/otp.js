import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // References the User model
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiry: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
