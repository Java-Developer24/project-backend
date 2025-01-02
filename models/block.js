import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    block_type: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const BlockModel =
  mongoose.models.BlockModel || mongoose.model("block-users", schema);

export { BlockModel };
