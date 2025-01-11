import Recharge from "../models/recharge.js";
import ServerData from "../models/serverData.js";

// Modified check maintenance function to dynamically check based on rechargeType
export const checkMaintenance = async (req, res, next) => {
  try {
    const { rechargeType } = req.query; // Extract rechargeType from query params
    // Fetch maintenance status for server 0
    const serverData = await ServerData.findOne({ server: 0 });
    // Check if maintenance is on
    if (serverData.maintenance) {
      
        return res.status(200).json({
          maintainance: true, // Maintenance is on
          
        });
      }
   

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
