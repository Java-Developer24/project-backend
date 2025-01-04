// models/Config.js
import mongoose from 'mongoose';

const configSchema = new mongoose.Schema(
  {
    minUpiAmount: {
      type: Number,
      required: true,
      default: 50, // default value, can be modified by the admin
    },
  },
  { timestamps: true }
);

const Config = mongoose.model('Config', configSchema);

export default Config;
