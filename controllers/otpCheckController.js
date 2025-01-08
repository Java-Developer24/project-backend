import Service from "../models/service.js"  
import ServerData from "../models/serverData.js";
import Configuration from "../models/configuration.js";

const searchCodes = async (codes) => {
  const results = [];

  for (const code of codes) {
    try {
      // Search for the server with the current code
      const serverData = await Service.findOne({
        "servers.code": code,
      });

      if (serverData) {
        // Find the server where the code matches
        const matchingServer = serverData.servers.find(
          (server) => server.code === code && server.serverNumber === 1
        );

        // If a matching server is found, push the result
        if (matchingServer) {
          // Check if the result for this code is already in results
          if (!results.some((result) => result._id === serverData._id)) {
            results.push({
              name: serverData.name,
              code: code,
              servers: serverData.servers.filter(
                (server) => server.code === code
              ),
            });
          }
          break; // Stop searching after finding a valid result
        }
      }
    } catch (error) {
      console.error(`Error searching for code ${code}:`, error);
    }
  }

  // If results are found, return the results with names
  if (results.length > 0) {
    return results.map((result) => result.name);
  } else {
    return [];
  }
};

const otpCheck = async (req, res) => {
  try {
    const { otp, api_key } = req.query;

    if (!otp) {
      return res.status(400).json({ error: "OTP is required" });
    }
    if (!api_key) {
      return res.status(400).json({ error: "Api Key is required" });
    }

    const serverData = await ServerData.findOne({ server: 1 });

    const encodedOtp = encodeURIComponent(otp);
    const response = await fetch(
      `https://fastsms.su/stubs/handler_api.php?api_key=${serverData.api_key}&action=getOtp&sms=${encodedOtp}`
    );

    const data = await response.json();

    if (data === false) {
      // Fetch the dynamic timing window from the configuration model
      const config = await Configuration.findOne({ key: "otpTimeWindow" });
      const timeWindowInMinutes = config ? config.value : 60; // Default to 60 minutes if not configured

      const timeLimit = new Date(Date.now() - timeWindowInMinutes * 60 * 1000);

      // Search in the database for the OTP
      const dbResults = await NumberHistory.find({
        otp,
        ...(req.query.service === "any other"
          ? { createdAt: { $gte: timeLimit } } // Filter for last `timeWindowInMinutes` only
          : {}), // No filter for other services
      }).sort({ createdAt: 1 }); // Return the oldest entry

      if (dbResults.length > 0) {
        return res.status(200).json({ result: dbResults[0] });
      } else {
        return res.status(404).json({ error: "No OTP found in the database" });
      }
    } else if (Array.isArray(data)) {
      let codes = [];

      // Extract codes from response
      if (data[0].includes("|")) {
        codes = data[0]
          .split("|")
          .map((part) => part.replace(/\d/g, "").trim())
          .filter((part) => part.length > 0);
      } else {
        codes.push(data[0].replace(/\d/g, "").trim());
      }

      // Search for codes in the database
      const results = await searchCodes(codes);

      if (results.length > 0) {
        return res.status(200).json({ results });
      } else {
        return res.status(404).json({ error: "No valid data found for the provided codes" });
      }
    } else {
      return res.status(500).json({ error: "Unexpected response format" });
    }
  } catch (error) {
    console.error("[OtpCheck] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

  
  export default otpCheck;