export const captureIpMiddleware = (req, res, next) => {
  // Capture the IP address (prefer x-forwarded-for, fallback to remoteAddress)
  const ip = req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",")[0].trim()
    : req.connection.remoteAddress;

  // Ensure the IP is in IPv4 or IPv6 format
  const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip); // Basic IPv4 check
  const isIPv6 = /[a-fA-F0-9:]+/.test(ip); // Basic IPv6 check

  console.log("Received IP:", ip);
  console.log("Is IPv4:", isIPv4);
  console.log("Is IPv6:", isIPv6);

  // Check if both IPv4 and IPv6 are present in the request
  if (isIPv4) {
    req.clientIpV4 = ip;
    console.log("IPv4:", req.clientIpV4);
  } else if (isIPv6) {
    req.clientIpV6 = ip;
    console.log("IPv6:", req.clientIpV6);
  }

  // If both IPv4 and IPv6 are detected in the request headers or remoteAddress,
  // they will be saved to req.clientIpV4 and req.clientIpV6 respectively.
  // Proceed with the request
  next();
};
