// serviceController.js
import axios from 'axios';

import Service from '../models/service.js';
import { userDiscountModel } from '../models/userDiscount.js'

import cron from "node-cron"
// Schedule the task to run every 10 minutes
// cron.schedule('*/1 * * * *', async () => {
//     console.log('Running scheduled task: fetchAndStoreServices');
//     await fetchAndStoreServices(); // Call your function
// });
// Helper function to normalize names
const normalizeName = (name) => {
    if (typeof name === 'string') {
      return name
        .toLowerCase()
        .replace(/\s+/g, '')  // Remove spaces
        .replace(/[^a-z0-9]/g, '');  // Remove non-alphanumeric characters
    }
    return '';  // Return empty string if name is not a string
  };
  
// Function to calculate the lowest price from an array of server prices
const calculateLowestPrice = (prices) => {
    return Math.min(...prices);  // Returns the lowest price from the array
  };
  
  // Function to update the lowestPrice field for all servers
  const calculateLowestPrices = async (serviceId) => {
    const service = await Service.findById(serviceId);
    const prices = service.servers.map(server => server.price);  // Extracting prices of all servers
    const lowestPrice = calculateLowestPrice(prices);  // Calculating the lowest price
    service.lowestPrice = lowestPrice;  // Update the lowestPrice field in the database
    await service.save();  // Save the updated service
  };
  
  // Function to fetch data with retry mechanism
  const fetchDataWithRetry = async (url, retries = 3, delay = 2000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(url, { timeout: 10000 });
        return response.data;
      } catch (error) {
        if (attempt === retries) throw error; // Propagate the error on the last attempt
        await new Promise(resolve => setTimeout(resolve, delay)); // Delay before retry
      }
    }
  };
  
// Function to calculate updated price with margin and multiplier using the pricing formula
const calculateUpdatedPrice = (price, serverNumber) => {
    // Get the pricing formula based on the server number
    const pricingFormula = getPricingFormula(serverNumber);
    
    // Apply the pricing formula to the price
    const updatedPrice = pricingFormula(price);  
    
    // Round to 2 decimal places to avoid excessive precision and store properly
    return parseFloat(updatedPrice.toFixed(2));
  };
  // Function to sort servers by updated price
  const sortServersByPrice = (servers) => {
    return servers.sort((a, b) => a.updatedPrice - b.updatedPrice);
  };
  
  // Function to sort services by name
  const sortServicesByName = (services) => {
    return services.sort((a, b) => a.name.localeCompare(b.name));
  };
  
  const fetchAndStoreServices = async () => {
    console.time("fetchAndStoreServices");
    try {
      // Fetch data from external service with a timeout of 10 seconds
      console.time("axios.get");
      const response = await fetchDataWithRetry('https://own5k.in/p/final.php');  // Using fetchDataWithRetry for robust data fetching
      console.timeEnd("axios.get");
  
      const servicesData = response;
  
      if (!Array.isArray(servicesData)) {
        console.log("Invalid service data format");
        return;
      }
  
      console.time("Service Processing");
      for (const serviceData of servicesData) {
        console.time(`Processing service: ${serviceData.name}`);
        const { name, servers } = serviceData;
  
        // Normalize the service name before saving
        const normalizedServiceName = normalizeName(name);
  
        // Update the price for each server based on the pricing formula
        const parsedServers = servers.map(server => {
          const { server: serverValue, price: priceValue, ...rest } = server;
          const serverNumber = parseInt(serverValue);
          const price = parseFloat(priceValue);
  
          // Get the pricing formula for this server
          const updatedPrice = calculateUpdatedPrice(price);  // Apply the pricing formula
          return {
            ...rest,
            serverNumber,
            price: updatedPrice,  // Set the updated price
          };
        });
  
        // Sort the servers by price after updating the price
        const sortedServers = sortServersByPrice(parsedServers);
  
        console.time("findOneAndUpdate");
  
        // Check if the service already exists by normalized name
        let service = await Service.findOne({ name: normalizedServiceName });
  
        if (!service) {
          // If service doesn't exist, create a new one
          service = new Service({ name: normalizedServiceName, servers: sortedServers });
          await service.save();
        } else {
          // If service exists, check if the servers or data have changed
          let isUpdated = false;
          if (JSON.stringify(service.servers) !== JSON.stringify(sortedServers)) {
            // If servers have changed, update the service
            isUpdated = true;
            service.servers = sortedServers;
          }
  
          // Check if the service data itself has changed (e.g., name or other fields)
          if (service.name !== normalizedServiceName) {
            isUpdated = true;
            service.name = normalizedServiceName;
          }
  
          // If there are changes, save the updated service
          if (isUpdated) {
            await service.save();
          }
        }
  
        console.timeEnd("findOneAndUpdate");
  
        if (!service) {
          console.log(`Error storing service: ${name}`);
          return;
        }
  
        // Calculate and update the lowest price after storing the service
        await calculateLowestPrices(service._id);
  
        console.timeEnd(`Processing service: ${serviceData.name}`);
      }
      console.timeEnd("Service Processing");
      console.timeEnd("fetchAndStoreServices");
  
      console.log('Services fetched and stored successfully');
    } catch (error) {
      console.timeEnd("fetchAndStoreServices");
      console.error("Error fetching and storing services:", error);
    }
  };
  
  // Function to find duplicates in the database
  const findDuplicates = async (Model) => {
    const documents = await Model.find().exec();
    const nameCounts = {};
    const duplicates = [];
  
    documents.forEach((doc) => {
      const name = doc.name;
      if (nameCounts[name]) {
        nameCounts[name]++;
      } else {
        nameCounts[name] = 1;
      }
    });
  
    for (const [name, count] of Object.entries(nameCounts)) {
      if (count > 1) {
        duplicates.push({ name, count });
      }
    }
  
    return duplicates;
  };
  
  // Function to check for duplicates and respond
  export const checkDuplicates = async (req, res) => {
    try {
      const serverListDuplicates = await findDuplicates(ServerList);
  
      res.json({
        serverListDuplicates,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  // Merge duplicate services by merging servers and updating service codes
  export const mergeDuplicates = async () => {
    try {
      const serverListDuplicates = await findDuplicates(ServerList);
  
      for (const duplicate of serverListDuplicates) {
        const duplicateDocs = await ServerList.find({
          name: duplicate.name,
        }).exec();
  
        if (duplicateDocs.length > 1) {
          // Merge logic: Choose one as the master and merge others into it
          const masterDoc = duplicateDocs[0];
          const docsToMerge = duplicateDocs.slice(1);
  
          for (const doc of docsToMerge) {
            // Merge servers
            masterDoc.servers.push(...doc.servers);
  
            // Remove merged document
            await ServerList.deleteOne({ _id: doc._id });
          }
  
          // Remove duplicate servers in the masterDoc
          const uniqueServers = Array.from(
            new Set(masterDoc.servers.map((server) => JSON.stringify(server)))
          ).map((server) => JSON.parse(server));
          masterDoc.servers = uniqueServers;
  
          await masterDoc.save();
        }
      }
  
      console.log("Duplicates merged successfully");
      await updateServiceCodes(); // Call the function to update service codes
      console.log("Service code added successfully");
    } catch (error) {
      console.error("Error merging duplicates:", error);
    }
  };
  
  // Update service codes for each service
  const updateServiceCodes = async () => {
    try {
      const serverList = await ServerList.find().exec();
  
      for (const server of serverList) {
        const normalizedCode = normalizeName(server.name);
        server.service_code = normalizedCode;
        await server.save();
      }
  
      console.log("Service codes updated successfully");
    } catch (error) {
      console.error("Error updating service codes:", error);
    }
  };
  
  // Function to update margin amount
  let marginAmt = 1; // Example margin amount, adjust as necessary
// Pricing formula function
const getPricingFormula = (serverNumber) => {
    // Multiplier for specific server numbers
    const multiplier = [3, 9, 10, 11].includes(serverNumber) ? 95 : 1.1;  // Specific multiplier for servers 3, 9, 10, 11
    return (price) => multiplier * price + marginAmt;  // Apply multiplier and margin
  };
  
  export const updateMarginAmount = (req, res) => {
    const { margin } = req.body;
    if (margin == null || isNaN(margin)) {
      return res.status(400).json({ error: 'Invalid margin amount.' });
    }
    marginAmt = parseFloat(margin);
    res.json({ message: 'Margin amount updated successfully.', marginAmt });
  };
  

export const getServiceData = async (req, res) => {
    console.time("fetchAndSendServices");
  
    try {
      console.time("axios.get");
      const response = await axios.get('https://own5k.in/p/final.php', { timeout: 10000 });
      console.timeEnd("axios.get");
  
      const servicesData = response.data;
  
      if (!Array.isArray(servicesData)) {
        console.error("Invalid service data format: Expected an array");
        return res.status(400).json({ message: "Invalid service data format." });
      }
  
      console.time("Service Processing");
  
      // Process the data
      const processedServices = servicesData.map((serviceData) => {
        const { name, servers } = serviceData;
  
        if (!name || !Array.isArray(servers)) {
          console.warn(`Skipping invalid service entry: ${JSON.stringify(serviceData)}`);
          return null;
        }
  
        // Normalize the service name
        const normalizedServiceName = normalizeName(name);
  
        // Update and calculate prices for servers
        const parsedServers = servers.map((server) => {
          const { server: serverValue, price: priceValue, ...rest } = server;
  
          // Validate server and price values
          const serverNumber = parseInt(serverValue, 10);
          const price = parseFloat(priceValue);
  
          if (isNaN(serverNumber) || isNaN(price)) {
            console.warn(`Skipping invalid server data: ${JSON.stringify(server)}`);
            return null;
          }
  
          // Get and apply the pricing formula
          const updatedPriceFormula = getPricingFormula('https://own5k.in/p/final.php', serverNumber);
          const updatedPrice = updatedPriceFormula(price);
          const roundedPrice = parseFloat(updatedPrice.toFixed(2)); // Round to 2 decimal places
  
          return {
            ...rest,
            serverNumber,
            price: roundedPrice,
          };
        }).filter(Boolean); // Remove invalid server entries
  
        // Sort servers by price
        const sortedServers = sortServersByPrice(parsedServers);
  
        return {
          name: normalizedServiceName,
          servers: sortedServers,
        };
      }).filter(Boolean); // Remove invalid service entries
  
      console.timeEnd("Service Processing");
      console.timeEnd("fetchAndSendServices");
  
      // Send the processed services as a response
      res.status(200).json({ services: processedServices });
    } catch (error) {
      console.timeEnd("fetchAndSendServices");
      console.error("Error fetching and processing services:", error);
      res.status(500).json({ message: "Failed to fetch and process services.", error: error.message });
    }
  };
  
  
  
//loggined user get services data  end point
const getUserServicesData = async (req, res) => {
    try {
           console.time("getServices");
        const services = await Service.find({ maintenance: false }).lean();
         console.timeEnd("Service.find");
        if (!services || services.length === 0) {
             console.log("No services found");
            return res.status(404).json({ message: 'No services found' });
        }
        console.time("mapping and sorting service");
        const servicesWithUpdatedPrice = services.map((service) => {
             const updatedServers= service.servers.map(server => ({
                   ...server,
                   updatedPrice: calculateUpdatedPrice(server.price, server.discount)
               }))
            const sortedServers = sortServersByPrice(updatedServers.filter((server) => !server.maintenance));

            return {
                ...service,
                servers: sortedServers,
            };
        });
         console.timeEnd("mapping and sorting service");
          console.time("sortServicesByName");
        const sortedServices = sortServicesByName(servicesWithUpdatedPrice);
         console.timeEnd("sortServicesByName");
          console.timeEnd("getServices");
        res.status(200).json(sortedServices);
    } catch (error) {
         console.timeEnd("getServices");
        console.error("Error getting services:", error);
        res.status(500).json({ message: 'Error getting services', error: error.message });
    }
};

const getUserServicesDatas = async (req, res) => {
    try {
      console.time("getServices");
      const { userId } = req.query;
      console.log(userId)
  
      // Fetch all services that are not under maintenance
      const services = await Service.find({ maintenance: false }).lean();
      console.timeEnd("Service.find");
  
      if (!services || services.length === 0) {
        console.log("No services found");
        return res.status(404).json({ message: 'No services found' });
      }
  
      console.time("mapping and sorting service");
  
      // Fetch the user-specific discount data
      const userDiscountData = userId ? await userDiscountModel.find({ userId }) : [];
  
      // Create a map for quick lookup of user-specific discounts by service and server
      const userDiscountMap = new Map();
      userDiscountData.forEach((discount) => {
        const key = `${discount.service}_${discount.server}`;
        userDiscountMap.set(key, discount.discount);
      });
  
      const servicesWithUpdatedPrice = services.map((service) => {
        const updatedServers = service.servers.map((server) => {
          // Initialize the discount at the server level
          let discount = 0;
  
          // Get the service-level discount if exists
          if (service.discount) {
            discount += service.discount; // Assuming the service model has a discount field
          }
  
          // Get the server-level discount if exists
          if (server.discount) {
            discount += server.discount;
          }
  
          // Get user-specific discount if exists
          const serviceKey = `${service.name}_${server.serverNumber}`;
          discount += userDiscountMap.get(serviceKey) || 0;
  
          // Apply the discount directly to the server price
          const originalPrice = parseFloat(server.price);
          server.price = (originalPrice + discount).toFixed(2); // Directly update the price with discounts
  
          return server;
        });
  
        // Filter out servers under maintenance and sort by the adjusted price
        const sortedServers = updatedServers
          .filter((server) => !server.maintenance)
          .sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); // Sort by updated price directly
  
        return {
          ...service,
          servers: sortedServers,
        };
      });
  
      console.timeEnd("mapping and sorting service");
  
      console.time("sortServicesByName");
      // Sort services by name
      const sortedServices = servicesWithUpdatedPrice.sort((a, b) => a.name.localeCompare(b.name));
      console.timeEnd("sortServicesByName");
  
      console.timeEnd("getServices");
      res.status(200).json(sortedServices);
    } catch (error) {
      console.timeEnd("getServices");
      console.error("Error getting services:", error);
      res.status(500).json({ message: 'Error getting services', error: error.message });
    }
  };
  


// Adds a new service with the provided details

const addService = async (req, res) => {
    try {
        const { name, serviceName, discount = 0 } = req.body;

        // Validate the required fields
        if (!name || !serviceName) {
            return res.status(400).json({ message: 'Service name and server number are required' });
        }

        // Parse the server number
        const serverNumber = parseInt(serviceName);
        if (isNaN(serverNumber)) {
            return res.status(400).json({ message: 'Invalid server number provided' });
        }

        // Create the server object
        const server = {
            serverNumber,
            price: 0, // Default price (can be updated later)
            code: `${name.toLowerCase()}-${serverNumber}`, // Generate a unique code
            maintenance: false,
            discount,
        };

        // Create the service object with the server included
        const newService = new Service({
            name,
            servers: [server], // Include the single server
            discount,
        });

        // Save the new service in the database
        const savedService = await newService.save();

        res.status(201).json({
            message: 'Service and server added successfully',
            savedService,
        });
    } catch (error) {
        console.error("Error adding service:", error);
        res.status(500).json({ message: 'Error adding service', error: error.message });
    }
};


// Updates an existing service with new details


export const updateServerMaintenance = async (req, res) => {
    try {
        const { name, serverNumber, block } = req.body; // Input data from the frontend

        // Validate inputs
        if (!name || typeof serverNumber === 'undefined' || typeof block !== 'boolean') {
            return res.status(400).json({ message: 'Service name, server number, and block status are required' });
        }

        // Find the service by name and update the specific server
        const updatedService = await Service.findOneAndUpdate(
            { name: name, "servers.serverNumber": serverNumber }, // Match service and server number
            { $set: { "servers.$.maintenance": block } },                // Update the server's maintenance status
            { new: true }                                               // Return the updated document
        );

        if (!updatedService) {
            return res.status(404).json({ message: 'Service or server not found' });
        }

        res.status(200).json({
            message: `Server ${serverNumber} in service '${name}' updated successfully`,
            updatedService,
        });
    } catch (error) {
        console.error("Error updating server maintenance:", error);
        res.status(500).json({ message: 'Error updating server maintenance', error: error.message });
    }
};





// Deletes a service by its ID
const deleteService = async (req, res) => {
    try {
        const { name } = req.body;

        // Validate the name field
        if (!name) {
            return res.status(400).json({ message: 'Service name is required' });
        }

        // Remove the service by name from the database
        const deletedService = await Service.findOneAndDelete({ name });

        if (!deletedService) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.status(200).json({ message: 'Service deleted successfully', deletedService });
    } catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({ message: 'Error deleting service', error: error.message });
    }
};


// Adds a new server to an existing service
const addServer = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { serverNumber, price, code, otpType, discount, maintenance } = req.body;

        // Validate the required fields
        if (!serverNumber || !price || !code || !otpType) {
            return res.status(400).json({ message: 'serverNumber, price, code, and otpType are required' });
        }

        // Find the service to which the server will be added
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Create a new server object
        const newServer = { serverNumber, price, code, otpType, discount, maintenance };

        // Add the server to the service
        service.servers.push(newServer);

        // Sort servers by price
        const sortedServers = sortServersByPrice(service.servers);
        service.servers = sortedServers;

        // Save the updated service
        const updatedService = await service.save();
        res.status(201).json(updatedService);
    } catch (error) {
        console.error('Error adding server:', error);
        res.status(500).json({ message: 'Error adding server', error: error.message });
    }
};

// Updates details of an existing server within a service
const updateServer = async (req, res) => {
    try {
        const { serverNumber, maintenance } = req.body;

        // Validate the input
        if (serverNumber === undefined || maintenance === undefined) {
            return res.status(400).json({ message: 'Server number and maintenance status are required' });
        }

        // Prepare the bulk update operation
        const bulkOps = [];

        // Create a bulk update operation for all services that contain the serverNumber
        bulkOps.push({
            updateMany: {
                filter: { "servers.serverNumber": serverNumber },  // Only update services that contain the specified serverNumber
                update: { $set: { "servers.$[elem].maintenance": maintenance } },
                arrayFilters: [{ "elem.serverNumber": serverNumber }]  // Only target the specific serverNumber
            }
        });

        if (bulkOps.length > 0) {
            // Execute the bulk write operation to update all services with the specified serverNumber
            const start = Date.now();
            const result = await Service.bulkWrite(bulkOps);
            const end = Date.now();
            console.log(`Total time for update: ${end - start}ms`);

            res.status(200).json({ message: `${result.modifiedCount} services updated successfully` });
        } else {
            res.status(404).json({ message: 'No matching servers to update' });
        }
    } catch (error) {
        console.error('Error updating server:', error);
        res.status(500).json({ message: 'Error updating server', error: error.message });
    }
};


// Deletes a specific server from a service
const deleteServer = async (req, res) => {
    try {
        const { serviceId, serverNumber } = req.params;

        // Find the service containing the server
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Locate and remove the server
        const serverIndex = service.servers.findIndex(server => server.serverNumber === parseInt(serverNumber));
        if (serverIndex === -1) {
            return res.status(404).json({ message: 'Server not found' });
        }

        service.servers.splice(serverIndex, 1);

        // Sort servers by price
        const sortedServers = sortServersByPrice(service.servers);
        service.servers = sortedServers;

        // Save the updated service
        const updatedService = await service.save();
        res.status(200).json({ message: 'Server deleted successfully', service: updatedService });
    } catch (error) {
        console.error('Error deleting server:', error);
        res.status(500).json({ message: 'Error deleting server', error: error.message });
    }
};

// Centrally updates servers across all services
const updateCentralizedServers = async (req, res) => {
    try {
        const { server, maintenance } = req.body;

        // Validate the input
        if (server === undefined || maintenance === undefined) {
            return res.status(400).json({ message: 'Server and maintenance status are required' });
        }

        // Create an array of bulk write operations
        const bulkOps = [];

        // If a specific server is provided (e.g., server 2), update only that server
        if (server === 0) {
            // Update all servers 1-11 in maintenance
            for (let serverNumber = 1; serverNumber <= 11; serverNumber++) {
                bulkOps.push({
                    updateMany: {
                        filter: { 'servers.serverNumber': serverNumber },
                        update: { $set: { 'servers.$.maintenance': maintenance } }
                    }
                });
            }
        } else {
            // If a specific server is provided, just update that one server
            bulkOps.push({
                updateMany: {
                    filter: { 'servers.serverNumber': server },
                    update: { $set: { 'servers.$.maintenance': maintenance } }
                }
            });
        }

        // Only execute if there are operations to perform
        if (bulkOps.length > 0) {
            const start = Date.now();
            const result = await Service.bulkWrite(bulkOps);
            console.log('Bulk write result:', result);
            const end = Date.now();
            console.log(`Total time for update: ${end - start}ms`); // Check the time for bulkWrite

            res.status(200).json({ message: 'Centralized update completed successfully' });
        } else {
            res.status(400).json({ message: 'No valid servers to update' });
        }
    } catch (error) {
        console.error('Error updating servers centrally:', error);
        res.status(500).json({ message: 'Error updating servers centrally', error: error.message });
    }
};



export const updateServiceDiscount = async (req, res) => {
    try {
        const { service, discount } = req.body;  // Extract service name and discount amount from payload

        // Validate the input
        if (!service || discount === undefined) {
            return res.status(400).json({ message: 'Service name and discount are required' });
        }

        // Perform the update operation to increment the discount value at the service level
        const result = await Service.updateOne(
            { name: service }, // Filter by service name
            { $inc: { discount: discount } } // Increment the discount value by the provided amount
        );

        // Check if the update operation was successful
        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Service not found or no discount updated' });
        }

        res.status(200).json({
            message: `Discount of ${discount} applied successfully to the service ${service}`
        });
    } catch (error) {
        console.error('Error updating service discount:', error);
        res.status(500).json({ message: 'Error updating service discount', error: error.message });
    }
};


export const getAllServiceDiscounts = async (req, res) => {
    try {
        // Fetch all services where there is a discount applied at the service level
        const services = await Service.find({
            discount: { $gt: 0 }  // Ensure that there is a discount greater than 0
        });

        // If no services with discounts are found
        if (services.length === 0) {
            return res.status(200).json([]);  // Return empty array
        }

        // Prepare the discount data to send in the response
        const discountData = services.map(service => {
            // For each service, include all its servers
            return service.servers
                .map(server => ({
                    id: service._id.toString(),  // Service document's ID
                    service: service.name,        // Service name
                    server: server.serverNumber,  // Server number
                    discount: service.discount,   // Discount at the service level
                    createdAt: service.createdAt,
                    updatedAt: service.updatedAt
                }));
        }).flat();  // Flatten the array of arrays into a single array

        // Filter out duplicates based on service name
        const uniqueDiscountData = [];
        const seenServices = new Set();  // Set to track unique service names

        discountData.forEach(data => {
            if (!seenServices.has(data.service)) {
                uniqueDiscountData.push(data);
                seenServices.add(data.service);  // Add service name to the set
            }
        });

        // Send the unique discount data as the response
        res.status(200).json(uniqueDiscountData);
    } catch (error) {
        console.error('Error getting discounts:', error);
        res.status(500).json({ message: 'Error getting discounts', error: error.message });
    }
};


export const deleteServiceDiscount = async (req, res) => {
    try {
        const { service } = req.query;  // Get service name from query

        // Validate payload
        if (typeof service === 'undefined') {
            return res.status(400).json({ message: 'Service field is required.' });
        }

        // Set the discount field to zero for the specified service using MongoDB's $set operator
        const updatedService = await Service.findOneAndUpdate(
            { name: service },  // Find the service by name
            { $set: { discount: 0 } },  // Set the discount field to 0
            { new: true }  // Return the updated document
        );

        if (!updatedService) {
            return res.status(404).json({ message: `Service ${service} not found.` });
        }

        return res.status(200).json({ message: `Discount set to zero for service ${service}.` });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};






export default {
    fetchAndStoreServices,
    getUserServicesDatas,
    getUserServicesData,
    addService,
    updateServerMaintenance,
    deleteService,
    updateServer,
    addServer,
    deleteServer,
    updateCentralizedServers,
    updateServiceDiscount,
    getAllServiceDiscounts,
    deleteServiceDiscount,
    getServiceData
};