import mongoose from "mongoose";

const configurationSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true }, // Value can represent minutes
});

const Configuration = mongoose.model("Configuration", configurationSchema);

export default Configuration;
