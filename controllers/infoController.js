import Info from "../models/info.js";

// Get banner information
// Get banner information or create default if not found
export const getBanner = async (req, res) => {
    try {
      // Fetch banner data from the database
      let info = await Info.findOne();
  
      if (!info) {
        // Create a default entry if no info is found
        info = new Info({
          banner: {
            message: 'Your default banner message here',
            type: 'info',  // You can modify this default type as needed
          },
          disclaimer: {
            content: 'Your default disclaimer message here',  // Modify default content
          },
        });
  
        // Save the default entry to the database
        await info.save();
      }
  
      return res.json({
        message: info.banner.message,
        type: info.banner.type,
      });
    } catch (error) {
      console.error('Error fetching banner:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
  
  // Get disclaimer information or create default if not found
  export const getDisclaimer = async (req, res) => {
    try {
      // Fetch disclaimer content from the database
      let info = await Info.findOne();
  
      if (!info) {
        // Create a default entry if no info is found
        info = new Info({
          banner: {
            message: 'Your default banner message here',  // Default message for banner
            type: 'info',  // Default type for banner
          },
          disclaimer: {
            content: 'Your default disclaimer message here',  // Modify default content
          },
        });
  
        // Save the default entry to the database
        await info.save();
      }
  
      return res.json({
        content: info.disclaimer.content,
      });
    } catch (error) {
      console.error('Error fetching disclaimer:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };



// Update banner information
export const updateBanner = async (req, res) => {
    const { banner } = req.body;
  
    if (!banner ) {
      return res.status(400).json({ message: 'Message and type are required' });
    }
  
    try {
      // Find the existing info document
      const info = await Info.findOne();
      if (!info) {
        return res.status(404).json({ message: 'Info not found' });
      }
  
      // Update banner message and type
      info.banner.message = banner;
     
  
      await info.save();
  
      return res.json({
        message: 'Banner updated successfully',
        banner: {
          message: info.banner.message,
          type: info.banner.type,
        },
      });
    } catch (error) {
      console.error('Error updating banner:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
  
  // Update disclaimer information
export const updateDisclaimer = async (req, res) => {
    const { disclaimer } = req.body;
  
    if (!disclaimer) {
      return res.status(400).json({ message: 'Content is required' });
    }
  
    try {
      // Find the existing info document
      const info = await Info.findOne();
      if (!info) {
        return res.status(404).json({ message: 'Info not found' });
      }
  
      // Update disclaimer content
      info.disclaimer.content = disclaimer;
  
      await info.save();
  
      return res.json({
        message: 'Disclaimer updated successfully',
        disclaimer: {
          content: info.disclaimer.content,
        },
      });
    } catch (error) {
      console.error('Error updating disclaimer:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };