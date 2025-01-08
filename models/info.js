
import mongoose from "mongoose"

// Schema for banner and disclaimer info
const infoSchema = new mongoose.Schema({
  banner: {
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default:"info",
      required: true,
    },
  },
  disclaimer: {
    content: {
      type: String,
      required: true,
    },
  },
});

const Info = mongoose.model('Info', infoSchema);

export default Info
