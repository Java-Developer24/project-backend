import Recharge from "../models/recharge.js";

// Modified check maintenance function to dynamically check based on rechargeType
export const checkMaintenance = async (req, res, next) => {
  try {
    const { rechargeType } = req.query; // Extract rechargeType from query params
   

    // If no rechargeType is provided, return an error
    if (!rechargeType) {
      return res.status(400).json({ error: "Missing rechargeType parameter" });
    }

    // Check the maintenance status based on rechargeType
    let maintenance;
    if (rechargeType === 'upi') {
      maintenance = await Recharge.findOne({ maintenanceStatusUpi: true });
    } else if (rechargeType === 'trx') {
      maintenance = await Recharge.findOne({ maintenanceStatusTrx: true });
    } else {
      return res.status(400).json({ error: "Invalid rechargeType parameter" });
    }
    

    // If maintenance is found, return the 503 response
    if (maintenance) {
      return res.status(200).json({ maintenance: true, });
    }

    // If no maintenance is found, return false
    return res.status(200).json({
      maintenance: false, // Indicates no maintenance, service is available
    });
  } catch (err) {
    res.status(500).json({ error: "Maintenance check failed." });
  }
};
