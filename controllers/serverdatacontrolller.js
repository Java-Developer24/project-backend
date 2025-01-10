
import ServerData from "../models/serverData.js";
import Service from "../models/service.js";
// Import the server model



// POST endpoint to create a new server entry
export const serverData = async (req, res) => {
    try {
      const servers = req.body; // Get the array of server data from the request body
     
  
      // Validate that the request contains a non-empty array of server objects
      if (!Array.isArray(servers) || servers.length === 0) {
        return res.status(400).json({ message: "Request body must be a non-empty array of server data" });
      }
  
      // Clear out the existing data in the ServerData collection
      await ServerData.deleteMany({});
  
      // Insert new server records
      const insertedServers = await ServerData.insertMany(
        servers.map((server) => ({
          ...server,
          discount: server.discount ?? 0, // Add default value for discount if not provided
        }))
      );
  
      // Respond with success message and inserted data
      res.status(201).json({ message: "Servers added successfully", data: insertedServers });
    } catch (err) {
      console.error("Error inserting servers:", err);
      res.status(500).json({ message: "Error inserting servers", error: err.message });
    }
  };
  
export const getServerData=async (req, res) => {
    try {
        // Fetch all servers from the database
        const servers = await ServerData.find();

        // Map the servers into the required format
        const formattedServers = servers.map(server => ({
            ID: server._id.toString(),
            server: server.server,
            maintenance: server.maintenance,
            api_key: server.api_key || "",
            block: server.block,
            token: server.token || "",
            exchangeRate: server.exchangeRate || 0,
            margin: server.margin || 0,
            createdAt: server.createdAt,
            updatedAt: server.updatedAt,
        }));

        // Send the formatted data as a response
        res.status(200).json(formattedServers);
    } catch (error) {
        console.error("Error fetching servers:", error);
        res.status(500).json({ message: "Failed to fetch servers" });
    }
};






export const addSeverDiscount = async (req, res) => {
    try {
        const { server, discount } = req.body;

        // Validate input
        if (typeof server === "undefined" || typeof discount === "undefined") {
            return res.status(400).json({ message: "Server number and discount are required." });
        }

        const serverNum = parseInt(server, 10);
        if (isNaN(serverNum)) {
            return res.status(400).json({ message: "Server number must be a valid number." });
        }

        const discountValue = parseFloat(discount);
        if (isNaN(discountValue)) {
            return res.status(400).json({ message: "Discount value must be a valid number." });
        }

        // Step 1: Update discount in ServerData
        const serverData = await ServerData.findOneAndUpdate(
            { server: serverNum },
            { $inc: { discount: discountValue } },
            { new: true }
        );

        if (!serverData) {
            return res.status(404).json({ message: `ServerData with server number ${serverNum} not found.` });
        }

        // Step 2: Bulk update discounts in related Services
        const updateResult = await Service.updateMany(
            { "servers.serverNumber": serverNum },
            { $inc: { "servers.$[elem].discount": discountValue } },
            {
                arrayFilters: [{ "elem.serverNumber": serverNum }],
                multi: true,
            }
        );

        if (updateResult.matchedCount === 0) {
            console.warn(`No services found containing server number ${serverNum}.`);
        }

        // Response format
        const response = {
            id: serverData._id,
            server: serverData.server,
            discount: serverData.discount,
            createdAt: serverData.createdAt,
            updatedAt: serverData.updatedAt,
        };

        return res.status(200).json([response]);
    } catch (error) {
        console.error("Error updating server discount:", error);
        return res.status(500).json({ message: "Internal server error.", error: error.message });
    }
};



export const getServerDiscount = async (req, res) => {
    try {
        // Retrieve all server discount data where the discount is greater than 0
        const discounts = await ServerData.find({ discount: { $gt: 0 } }, 'server discount createdAt updatedAt');

        // If no server discounts found or all discounts are 0, return an empty array
        if (discounts.length === 0) {
            return res.status(200).json([]);  // Return empty array
        }

        // Format data to match the specified response
        const formattedDiscounts = discounts.map((server) => ({
            id: server._id,
            server: server.server,
            discount: server.discount,
            createdAt: server.createdAt,
            updatedAt: server.updatedAt,
        }));

        return res.status(200).json(formattedDiscounts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};

export const deleteServerDiscount = async (req, res) => {
    try {
        const { server } = req.query;

        // Validate payload
        if (typeof server === 'undefined') {
            return res.status(400).json({ message: 'Server field is required.' });
        }

        // Ensure `server` is a number
        const serverNumber = parseInt(server, 10);
        if (isNaN(serverNumber)) {
            return res.status(400).json({ message: 'Server must be a valid number.' });
        }

        // Step 1: Remove the discount field in ServerData
        const updatedServer = await ServerData.findOneAndUpdate(
            { server: serverNumber },
            { $unset: { discount: "" } }, // Remove the `discount` field
            { new: true } // Return the updated document
        );

        if (!updatedServer) {
            return res.status(404).json({ message: `Server ${serverNumber} not found.` });
        }

        // Step 2: Remove the discount from related Services
        const updateResult = await Service.updateMany(
            { "servers.serverNumber": serverNumber },
            { $set: { "servers.$[elem].discount": 0 } }, // Set discount to 0 in servers array
            {
                arrayFilters: [{ "elem.serverNumber": serverNumber }],
                multi: true,
            }
        );

        if (updateResult.matchedCount === 0) {
            console.warn(`No services found containing server number ${serverNumber}.`);
        }

        // Step 3: Return an empty array as the response
        return res.status(200).json([]);

    } catch (error) {
        console.error("Error deleting server discount:", error);
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};


export const updateAPIKey= async (req, res) => {
    const { server, api_key } = req.body;
  
    if (!server || !api_key) {
      return res.status(400).json({ message: "Server and API key are required" });
    }
  
    try {
      const updatedServer = await ServerData.findOneAndUpdate(
        { server },
        { api_key },
        { new: true }
      );
  
      if (!updatedServer) {
        return res.status(404).json({ message: "Server not found" });
      }
  
      res.json({ message: "API key updated successfully" });
    } catch (error) {
      console.error("Error updating API key:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  export const  updateExchangeRate= async (req, res) => {
    const { server, exchangeRate } = req.body;
  
    if (!server || exchangeRate === undefined) {
      return res.status(400).json({ message: "Server and exchange rate are required" });
    }
  
    try {
      const updatedServer = await ServerData.findOneAndUpdate(
        { server },
        { exchangeRate },
        { new: true }
      );
  
      if (!updatedServer) {
        return res.status(404).json({ message: "Server not found" });
      }
  
      res.json({ message: "Exchange rate updated successfully" });
    } catch (error) {
      console.error("Error updating exchange rate:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  export const updateMarginAmount= async (req, res) => {
    const { server, margin } = req.body;
  
    if (!server || margin === undefined) {
      return res.status(400).json({ message: "Server and margin are required" });
    }
  
    try {
      const updatedServer = await ServerData.findOneAndUpdate(
        { server },
        { margin },
        { new: true }
      );
      const updateserver=await ServerData.findOneAndUpdate(
        { server:0 },
        { margin },
        { new: true })
  
      if (!updatedServer||!updateserver) {
        return res.status(404).json({ message: "Server not found" });
      }
  
      res.json({ message: "Margin updated successfully" });
    } catch (error) {
      console.error("Error updating margin:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
export const addServerDataAdmin=async (req, res) => {
    const { server, api_key } = req.body;
  
    // Validate input fields
    if (!server || !api_key) {
      return res.status(400).json({ message: "Server and API key are required" });
    }
  
    // Default data for other fields
    const newServerData = {
      server,                          // From the request payload
      api_key,                          // From the request payload
      ID: generateUniqueID(),           // Assuming you'll have some logic to generate a unique ID
      maintainance: false,              // Default to false
      block: false,                     // Default to false
      exchangeRate: 0,                  // Default to 0
      margin: 0,                        // Default to 0
      discount: 0,                      // Default to 0
    };
  
    try {
      const serverCreated = new ServerData(newServerData);
      await serverCreated.save();
  
      res.json({ message: "Server created successfully", data: serverCreated });
    } catch (error) {
      console.error("Error creating server:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
 // Function to generate a unique ID in the desired format
function generateUniqueID() {
    return Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
  }
  