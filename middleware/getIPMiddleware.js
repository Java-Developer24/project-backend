export const captureIpMiddleware = (req, res, next) => {
    const ip = req.headers["x-forwarded-for"]
      ? req.headers["x-forwarded-for"].split(",")[0].trim()
      : req.connection.remoteAddress;
  
    // Set the IP on req.ip
    req.ip = ip;
  
    next(); // Call the next middleware or route handler
  };
  