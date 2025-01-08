import mongoose from "mongoose";
const NumberHistorySchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    server: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    Discount: {
      type: Number,
      required: true,
    },
    number: {
      type: String,
      required: true,
    },
    requestId:Number,
    otps: [
      {
        message: String, // OTP message or "No SMS" if cancelled
        date: Date, // Date of the SMS
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Success', 'Cancelled',"Pending","Finished"],
      required: true,
    },
    date_time: String,
    id:{
      type:String,
      required:true
    },
    reason:String,
   
  });
  const NumberHistory = mongoose.model('NumberHistory', NumberHistorySchema);


  const RechargeHistorySchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transactionId: {
      type: String,
      unique: true,
      required: true,
    },
    method: {
      type: String,
      enum: ['upi', 'trx', 'Admin'],
      required: true,
    },
    
    exchangeRate: {
      type: Number, // Only for TRX recharges
      default: null,
    },
    amount: {
      type: Number,
      required: true, // In INR
    },
    date_time: String,
    status:String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });
  
  const RechargeHistory = mongoose.model('RechargeHistory', RechargeHistorySchema);
  export {RechargeHistory,NumberHistory}
  