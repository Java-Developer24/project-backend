import mongoose from "mongoose";

const serverSchema = new mongoose.Schema(
  {
    ID: { type: String, required: true },
    server: { type: Number, required: true },
    maintainance: { type: Boolean, required: true },
    api_key: { type: String, required: false },
    block: { type: Boolean, required: true },
    token: { type: String, required: false },
    exchangeRate: { type: Number, required: true },
    margin: { type: Number, required: true },
    discount: { type: Number, required: true, default: 0 }, // Added discount field
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

const ServerData = mongoose.model("ServerData", serverSchema);

export default ServerData;
