import mongoose from 'mongoose';

const serverSchema = new mongoose.Schema({
    serverNumber: { type: Number, required: true },
    price: { type: Number, required: true },
    code: { type: String, required: true },
    otp: { type: String, enum: ["Single Otp", "Multiple Otp", "Single Otp & Fresh Number"], required: false },
    maintenance: { type: Boolean, default: false },
    discount: { type: Number, default: 0 },
}, { timestamps: true });

// In server schema
serverSchema.index({ serverNumber: 1 });
serverSchema.index({ price: 1 });
serverSchema.index({ maintenance: 1 });  // Add maintenance indexing



const Server = mongoose.model('Server', serverSchema);

export default Server;
export { serverSchema };
