import User from "../models/user.js";
import { BlockModel } from "../models/block.js";
import { RechargeHistory, NumberHistory } from "../models/history.js";

const predefinedBlockTypes = [
  { block_type: "Number_Cancel", status: false },
  { block_type: "User_Fraud", status: false },
];

export const savePredefinedBlockTypes = async (req, res) => {
  try {
    // Loop through the predefined block types and save each one to the database
    for (const blockType of predefinedBlockTypes) {
      // Check if the block type already exists to avoid duplicates
      const existingRecord = await BlockModel.findOne({
        block_type: blockType.block_type,
      });

      if (!existingRecord) {
        // Save the new block type
        const newBlockType = new BlockModel(blockType);
        await newBlockType.save();
      }
    }

    res.status(201).json({ message: "Block types saved successfully." });
  } catch (error) {
    console.error("Error saving predefined block types:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleBlockStatus = async (req, res) => {
  const { blockType, status } = req.body;

  try {
    const updatedRecord = await BlockModel.findOneAndUpdate(
      { block_type: blockType },
      { status },
      { new: true }
    );

    if (updatedRecord) {
      res.status(200).json({
        message: "Block status updated successfully.",
        data: updatedRecord,
      });
    } else {
      res.status(404).json({ message: "Block type not found." });
    }
  } catch (error) {
    console.error("Error updating block status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getBlockStatus = async (req, res) => {
  const { blockType } = req.query;

  try {
    const record = await BlockModel.findOne({
      block_type: blockType,
    });

    if (record) {
      res.status(200).json({ status: record.status });
    } else {
      res.status(404).json({ message: "Block type not found." });
    }
  } catch (error) {
    console.error("Error fetching block status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const BlockFraudClear = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find the user
    const user = await User.findOne({ _id:userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete all recharge records for the user
    await RechargeHistory.deleteMany({ userId });

    // Delete all transaction records for the user
    await NumberHistory.deleteMany({ userId });

    // Set the user's balance to 0
    user.balance = 0;
    await user.save();

    res.status(200).json({ message: "User data cleared successfully" });
  } catch (error) {
    console.error("Error in BlockFraudClear:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
