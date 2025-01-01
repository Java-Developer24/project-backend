import ServerList from "../models/service.js"  
  const otpCheck = async (req, res) => {
    try {
      const { otp, api_key } = req.query;
  
      if (!otp) {
        return res.status(400).json({ error: "OTP is required" });
      }
      if (!api_key) {
        return res.status(400).json({ error: "Api Key is required" });
      }
  
      const apiKeys= {fastsms: 'd91be54bb695297dd517edfdf7da5add'}
  
      const encodedOtp = encodeURIComponent(otp);
  
      const response = await fetch(
        `https://fastsms.su/stubs/handler_api.php?api_key=${apiKeys.fastsms}&action=getOtp&sms=${encodedOtp}`
      );
      
      const data = await response.json();
      console.log(data)
      // Handle different types of responses
      if (data === false) {
        return res.status(404).json({ error: "OTP not found" });
      } else if (Array.isArray(data)) {
        let codes = [];
  
        // Extract codes from response
        if (data[0].includes("|")) {
          codes = data[0]
            .split("|")
            .map((part) => part.replace(/\d/g, "").trim()) // Remove digits and trim
            .filter((part) => part.length > 0); // Remove empty parts
        } else {
          codes.push(data[0].replace(/\d/g, "").trim()); // Handle single string
        }
  
        console.log(codes);
  
        // Search for codes and get results
        const results = await searchCodes(codes);
  
        if (results.length > 0) {
          return res.status(200).json({ results });
        } else {
          return res
            .status(404)
            .json({ error: "No valid data found for the provided codes" });
        }
      } else {
        return res.status(500).json({ error: "Unexpected response format" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      console.error(error);
    }
  };

  const searchCodes = async (codes) => {
    const results = [];
  
    for (const code of codes) {
      try {
        // Search for the server with the current code
        const serverData = await ServerList.findOne({
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
  
  
  export default otpCheck;