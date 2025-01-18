export const captureIpMiddleware = (req, res, next) => {
  // Capture the IP address (prefer x-forwarded-for, fallback to remoteAddress)
  const ip = req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",")[0].trim()
    : req.connection.remoteAddress;

  // Ensure the IP is in IPv4 or IPv6 format
  const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip); // Basic IPv4 check
  const isIPv6 = /[a-fA-F0-9:]+/.test(ip); // Basic IPv6 check

  if (isIPv4) {
    req.clientIpV4 = ip;
  } else if (isIPv6) {
    req.clientIpV6 = ip;
  }

  // Proceed with the request
  next();
};
