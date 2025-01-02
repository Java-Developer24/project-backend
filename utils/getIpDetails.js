export const getIpDetails = async (req) => {
    // Get the IP address
    const ip = req.headers["x-forwarded-for"]
      ? req.headers["x-forwarded-for"].split(",")[0].trim()
      : req.connection.remoteAddress;
  
    try {
      console.log(ip);
      // Make a request to the IP-API service
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await response.json();
  
      // Check if the request was successful
      if (data.status === "fail") {
        throw new Error(data.message);
      }
  
      // Extract required details
      const {
        city,
        regionName: state,
        zip: pincode,
        country,
        isp: serviceProvider,
      } = data;
  
      // Return the IP details
      return { city, state, pincode, country, serviceProvider, ip };
    } catch (error) {
      // Handle error (e.g., log it, send a response, etc.)
      return {
        city: "unknown",
        state: "unknown",
        pincode: "unknown",
        country: "unknown",
        serviceProvider: "unknown",
        ip,
      };
    }
  };