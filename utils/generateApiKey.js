import crypto from 'crypto';

const generateApiKey = () => {
  return crypto.randomUUID().toString("hex").split("-").join("");; // Generate a 64-character random API key
};
export default generateApiKey