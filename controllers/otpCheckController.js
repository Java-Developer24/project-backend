import Service from "../models/service.js"  
import ServerData from "../models/serverData.js";
import Configuration from "../models/configuration.js";
import Admin from '../models/mfa.js'
import { NumberHistory } from "../models/history.js";

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

// const otpCheck = async (req, res) => {
//   try {
//     const { otp, api_key } = req.query;
//     console.log(otp)

//     if (!otp) {
//       return res.status(400).json({ error: "OTP is required" });
//     }
//     if (!api_key) {
//       return res.status(400).json({ error: "Api Key is required" });
//     }

//     // Fetch the checkopt value from AdminSchema to determine behavior
//     const adminSettings = await Admin.findOne({});
//     if (!adminSettings) {
//       return res.status(500).json({ error: "Admin settings not found" });
//     }

//     const checkopt = adminSettings.checkOtp; // check whether to query the OTP in DB or not

//     // Always execute the OTP validation with external service
//     const serverData = await ServerData.findOne({ server: 1 });

//     const encodedOtp = encodeURIComponent(otp);
//     const response = await fetch(
//       `https://fastsms.su/stubs/handler_api.php?api_key=${serverData.api_key}&action=getOtp&sms=${encodedOtp}`
//     );

//     const data = await response.json();
//     console.log(data)

//     // If checkopt is true, proceed to check the OTP in the database
//     if (checkopt) {
//       if (data === false) {
//         // Fetch the dynamic timing window from the configuration model
//         const config = await Configuration.findOne({ key: "otpTimeWindow" });
//         const timeWindowInMinutes = config ? config.value : 60; // Default to 60 minutes if not configured

//         const timeLimit = new Date(Date.now() - timeWindowInMinutes * 60 * 1000);

//         // Search in the database for the OTP
//         const dbResults = await NumberHistory.find({
//           otp,
//           ...(req.query.service === "any other"
//             ? { createdAt: { $gte: timeLimit } } // Filter for last `timeWindowInMinutes` only
//             : {}), // No filter for other services
//         }).sort({ createdAt: 1 }); // Return the oldest entry

//         if (dbResults.length > 0) {
//           return res.status(200).json({ 
//             results: [
//               {
//                 serviceName: dbResults[0].serviceName,
//                 server: dbResults[0].server
//               }
//             ] 
//           });
          
//         } else {
//           return res.status(404).json({ results: "No OTP found in the database" });
//         }
//       }
//     }

//     // If response data is an array, extract the OTP codes
//     if (Array.isArray(data)) {
//       let codes = [];

//       // Extract codes from response
//       if (data[0].includes("|")) {
//         codes = data[0]
//           .split("|")
//           .map((part) => part.replace(/\d/g, "").trim())
//           .filter((part) => part.length > 0);
//       } else {
//         codes.push(data[0].replace(/\d/g, "").trim());
//       }

//       // Search for codes in the database
//       const results = await searchCodes(codes);
//       console.log("results",results[0])

//       if (results.length > 0) {
//         return res.status(200).json({ results:[{ serviceName: results[0] }] });
//       } else {
//         return res.status(404).json({ error: "No valid data found for the provided codes" });
//       }
//     } else {
//       return res.status(500).json({ error: "Unexpected response format" });
//     }
//   } catch (error) {
//     console.error("[OtpCheck] Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

const otpCheck = async (req, res) => {
  try {
    const { otp, api_key } = req.query;

    console.log("[OtpCheck] Incoming OTP:", otp);
    console.log("[OtpCheck] Incoming API Key:", api_key);

    if (!otp) return res.status(400).json({ error: "OTP is required" });
    if (!api_key) return res.status(400).json({ error: "API Key is required" });

    // Fetch admin settings to check if database lookup is enabled
    const adminSettings = await Admin.findOne({});
    if (!adminSettings) {
      console.error("[OtpCheck] Admin settings not found");
      return res.status(500).json({ error: "Admin settings not found" });
    }
    console.log("[OtpCheck] Admin settings:", adminSettings);

    const checkopt = adminSettings.checkOtp; // Whether to check OTP in DB
    console.log("[OtpCheck] checkopt value:", checkopt);

    // Fetch server API key
    const serverData = await ServerData.findOne({ server: 1 });
    console.log("[OtpCheck] Server data:", serverData);

    const encodedOtp = encodeURIComponent(otp);
    console.log("[OtpCheck] Encoded OTP:", encodedOtp);

    // Call external API
    const response = await fetch(
      `https://fastsms.su/stubs/handler_api.php?api_key=${serverData.api_key}&action=getOtp&sms=${encodedOtp}`
    );
    const externalData = await response.json();
    console.log("[OtpCheck] External API Response:", externalData);

    let combinedResults = []; // Array to store API & DB results

    // Process external API response
    if (Array.isArray(externalData)) {
      let codes = [];

      if (externalData[0].includes("|")) {
        codes = externalData[0]
          .split("|")
          .map((part) => part.replace(/\d/g, "").trim())
          .filter((part) => part.length > 0);
      } else {
        codes.push(externalData[0].replace(/\d/g, "").trim());
      }

      console.log("[OtpCheck] Extracted codes from external API:", codes);

      // Get external API matching results
      const apiResults = await searchCodes(codes);
      console.log("[OtpCheck] API Results:", apiResults);

      if (apiResults.length > 0) {
        combinedResults.push({
          serviceName: apiResults[0],
        });
      }
    }

    // **If checkopt is enabled, perform database search**
    if (checkopt) {
      // Remove digits from OTP to extract text format
      const otpText = otp.replace(/\d/g, "").trim();
      console.log("[OtpCheck] OTP Text (after removing digits):", otpText);

      // Fetch dynamic time window from DB (this time is in seconds)
      const config = await Configuration.findOne({ key: "otpTimeWindow" });
      const timeWindowInSeconds = config ? config.value : 60; // Time window in seconds, defaulting to 60 seconds if not found

      // Convert seconds to milliseconds
      const timeWindowInMillis = timeWindowInSeconds * 1000;

      // Get current time in milliseconds
      const currentTimeInMillis = Date.now();

      // Calculate the time limit (timeWindowInSeconds ago) in milliseconds
      const timeLimitInMillis = currentTimeInMillis - timeWindowInMillis;

      const targetDate = new Date("2025-01-27T23:14:56.547+00:00"); // The date from DB
      const currentDate = new Date(); // The current date and time
      
      // Calculate the difference in milliseconds
      const differenceInMillis = currentDate - targetDate;
      
      console.log("[OtpCheck] Time difference in milliseconds:", differenceInMillis);
      

      console.log("[OtpCheck] Time Window in Seconds:", timeWindowInSeconds);
      console.log("[OtpCheck] Time Window in Milliseconds:", timeWindowInMillis);
      console.log("[OtpCheck] Time Limit in Milliseconds:", timeLimitInMillis);

      // Query the database for the OTP (both matching full OTP or text part within the time window)
      const dbResults = await NumberHistory.find({
        $or: [
          { otp: { $regex: otpText, $options: "i" } }, // Case-insensitive partial match on text part
          { otp: { $regex: otp, $options: "i" } }      // Case-insensitive match on full OTP
        ],
        date: { $gte: new Date(timeLimitInMillis) } // Query time in milliseconds
      }).sort({ date: 1 });

      console.log("[OtpCheck] Database Results:", dbResults);

      if (dbResults.length > 0) {
        combinedResults.push({
          serviceName: dbResults[0].serviceName,
          server: `Server ${dbResults[0].server}`,
        });
      }
    }      

    // If no results found, return appropriate response
    if (combinedResults.length > 0) {
      console.log("[OtpCheck] Combined Results:", combinedResults);
      return res.status(200).json({ results: combinedResults });
    } else {
      console.log("[OtpCheck] No matching results found");
      return res.status(404).json({ results: "No matching data found" });
    }
  } catch (error) {
    console.error("[OtpCheck] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};




export const checkOtpUpdate= async (req, res) => {
  try {
    // Extract the checkOtp value from the request body
    const { checkOtp } = req.body;

    // Validate the input
    if (typeof checkOtp !== 'boolean') {
      return res.status(400).json({ error: "Invalid input: checkOtp must be a boolean value" });
    }

    // Update the checkOtp value in the Admin collection
    const updatedAdmin = await Admin.findOneAndUpdate(
      {}, // No filter, updating the first document it finds
      { $set: { checkOtp: checkOtp } }, // Set the new value for checkOtp
      { new: true } // Return the updated document
    );

    if (!updatedAdmin) {
      return res.status(404).json({ error: "Admin settings not found" });
    }

    return res.status(200).json({ message: `checkOtp updated to ${checkOtp}`, updatedAdmin });

  } catch (error) {
    console.error('Error updating checkOtp:', error);
    res.status(500).json({ error: 'Error updating checkOtp', details: error.message });
  }
};


export const getOtpcheck= async (req, res) => {
  try {
    // Fetch the first document from the Admin collection
    const adminSettings = await Admin.findOne({});

    if (!adminSettings) {
      return res.status(404).json({ error: "Admin settings not found" });
    }

    // Return the current checkOtp value
    return res.status(200).json({ checkOtp: adminSettings.checkOtp });

  } catch (error) {
    console.error('Error fetching checkOtp:', error);
    res.status(500).json({ error: 'Error fetching checkOtp', details: error.message });
  }
};



  export default otpCheck;