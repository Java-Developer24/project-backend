export const captureIpMiddleware = (req, res, next) => {
  // Capture the IP address (prefer x-forwarded-for, fallback to remoteAddress)
  const ip = req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",")[0].trim()
    : req.connection.remoteAddress;

  // Ensure the IP is in IPv4 or IPv6 format
  const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip); // Specific IPv4 regex
  const isIPv6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip); // Refined IPv6 regex

  console.log("Received IP:", ip);
  console.log("Is IPv4:", isIPv4);
  console.log("Is IPv6:", isIPv6);

  // Store the IPs in their respective variables if they match the patterns
  if (isIPv4) {
    req.clientIpV4 = ip;
    console.log("IPv4:", req.clientIpV4);
  } else if (isIPv6) {
    req.clientIpV6 = ip;
    console.log("IPv6:", req.clientIpV6);
  }

  // Proceed with the request
  next();
};
