export const captureIpMiddleware = (req, res, next) => {
  const ip = req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",")[0].trim()
    : req.connection.remoteAddress;

  // Store the IP in a custom property
  req.clientIp = ip;

  next(); // Call the next middleware or route handler
};
