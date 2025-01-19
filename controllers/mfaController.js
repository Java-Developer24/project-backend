

import speakeasy from "speakeasy"
import qrcode from "qrcode"
import  Admin from "../models/mfa.js"


export const enable2FA = async (req, res) => {
    try {
        const { tempEmail } = req.body;
        console.log( req.body) 

        // Generate a new 2FA secret
        const secret = speakeasy.generateSecret({ name: `YourApp - Admin ${tempEmail}` });

        // Save the 2FA secret to the database
        await Admin.findOneAndUpdate(
            { email: tempEmail }, // Query object to find the document
            { 
              twoFASecret: secret.base32, 
              is2FAEnabled: true 
            }, // Update object
            { new: true } // Options (optional)
          );

        // Generate the QR code URL
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
        console.log(qrCodeUrl)

        res.json({ 
            message: '2FA has been enabled. Scan the QR code with your Authenticator app.', 
            qrCodeUrl 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error enabling 2FA.' });
    }
};

export const mfaStatuscheck = async (req, res) => {
  try {
    const { tempEmail } = req.body;

    // Fetch admin data from the database
    const admin = await Admin.findOne({ email: tempEmail });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Determine if MFA setup is complete
    const is2FASetupComplete = !!admin.twoFASecret; // True if secret exists, false otherwise

    return res.json({
      success: true,
      is2FAEnabled: admin.is2FAEnabled,
      is2FASetupComplete,
    });
  } catch (error) {
    console.error("Error checking MFA status:", error);
    return res.status(500).json({ success: false, message: "An error occurred" });
  }
};



export const getMFAStatus = async (req, res) => {
  try {
    const { tempEmail } = req.body; // Get the user's email from the request body

    // Find the user in the database based on their email
    const user = await Admin.findOne({ email: tempEmail });

    // If the user doesn't exist, return an error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send back the MFA status details
    res.json({
      is2FAEnabled: user.is2FAEnabled, // Whether 2FA is enabled
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching MFA status." });
  }
};

// controllers/2faController.js (continued)

export const verify2FAToken = async (req, res) => {
    try {
        const { tempEmail, mfaCode } = req.body;
       

        // Fetch the 2FA secret stored in the database
        const admin = await Admin.findOne({email: tempEmail});
        console.log(admin)
        if (!admin || !admin.twoFASecret) {
            return res.status(400).json({ message: '2FA is not enabled for this admin.' });
        }
        console.log(admin.twoFASecret)
        console.log(mfaCode)

        // Verify the token
        const isValid = speakeasy.totp.verify({
            secret: admin.twoFASecret,
            encoding: 'base32',
            token: mfaCode
        });
        console.log(isValid)

        if (isValid) {
            res.json({ message: '2FA verified successfully. Access granted.' });
        } else {
            res.status(400).json({ message: 'Invalid 2FA token.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error verifying 2FA.' });
    }
};


// controllers/2faController.js (continued)

export const disable2FA = async (req, res) => {
  try {
    const { tempEmail,mfaCheck } = req.body;

    // Remove the 2FA secret and set is2FAEnabled to false
    await Admin.findOneAndUpdate(
      { email: tempEmail },
      { 
        twoFASecret: null, 
        is2FAEnabled: mfaCheck 
      }
    );

    res.json({ message: '2FA has been disabled.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error disabling 2FA.' });
  }
};


export const getAdminIP= async (req, res) => {
    try {
      const admin = await Admin.findOne();
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      res.status(200).json({ adminIp: admin.adminIp });
    } catch (error) {
      console.error('Error fetching admin IP:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  
  export const updateAdminIP = async (req, res) => {
    const { ip } = req.body;
  
    // Default IP to use if none is provided
    const defaultIp = '::1'; // Change this to the desired default IP
  
    if (!ip) {
      return res.status(400).json({ message: 'IP address is required' });
    }
  
    try {
      const admin = await Admin.findOne();
  
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      // If adminIp is not set, use the default IP
      if (!admin.adminIp) {
        admin.adminIp = defaultIp;
      } else {
        // If adminIp exists, update it with the new IP
        admin.adminIp = ip;
      }
  
      await admin.save();
  
      res.status(200).json({ message: 'Admin IP updated successfully', adminIp: admin.adminIp });
    } catch (error) {
      console.error('Error updating admin IP:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

  export const getAPIAdminIP= async (req, res) => {
    try {
      const admin = await Admin.findOne();
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      res.status(200).json({ apiadminIP: admin.apiAdminIp });
    } catch (error) {
      console.error('Error fetching admin IP:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  
  export const updateAPIAdminIP = async (req, res) => {
    const { ip } = req.body;
  
    // Default IP to use if none is provided
    const defaultIp = '::1'; // Change this to the desired default IP
  
    if (!ip) {
      return res.status(400).json({ message: 'IP address is required' });
    }
  
    try {
      const admin = await Admin.findOne();
  
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      // If adminIp is not set, use the default IP
      if (!admin.apiAdminIp) {
        admin.apiAdminIp = defaultIp;
      } else {
        // If adminIp exists, update it with the new IP
        admin.apiAdminIp = ip;
      }
  
      await admin.save();
  
      res.status(200).json({ message: 'Admin API IP updated successfully', apiadminIP: admin.apiAdminIp });
    } catch (error) {
      console.error('Error updating admin IP:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

  export const getJobRunMinutes= async (req, res) => {
    try {
      const admin = await Admin.findOne();  // Fetch the first admin document (you can adjust if needed)
  
      if (!admin || admin.minute === undefined) {
        return res.status(404).json({ message: 'Minute value not found in the database.' });
      }
  
      return res.status(200).json({ minute: admin.minute });
    } catch (error) {
      console.error('Error fetching cron interval:', error);
      return res.status(500).json({ message: 'Failed to fetch cron interval.' });
    }
  };

  export const updateJobRunMinutes=async (req, res) => {
    const { minute } = req.body;  // Get the new minute value from the request body
  console.log(minute)
    if (!minute || minute <= 0) {
      return res.status(400).json({ message: 'Invalid minute value. It should be a positive number.' });
    }
  
    try {
      const admin = await Admin.findOne();
  
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found.' });
      }
  
      // Update the minute value
      admin.minute = minute;
      await admin.save();  // Save the updated value
  
      return res.status(200).json({ message: 'Minute value updated successfully.', minute: admin.minute });
    } catch (error) {
      console.error('Error updating cron interval:', error);
      return res.status(500).json({ message: 'Failed to update cron interval.' });
    }
  };