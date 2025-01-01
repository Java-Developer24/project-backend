import mongoose from 'mongoose';

const RechargeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    
  },
  method: {
    type: String,
    enum: ['TRX', 'UPI'], // Recharge method
    required: true,
  },
  amount: {
    type: Number,
     // Minimum recharge amount is ₹50
  },
  transactionId: {
    type: String, // Unique Transaction ID
    
    unique: true, // Ensure each transaction ID is unique
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'], // Transaction status
    default: 'pending',
  },
  maintenanceStatusUpi: {
    type: Boolean,
    default: false, // Indicates if UPI is under maintenance
  },
  maintenanceStatusTrx: {
    type: Boolean,
    default: false, // Indicates if TRX is under maintenance
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Recharge = mongoose.model('Recharge', RechargeSchema);

export default Recharge;
