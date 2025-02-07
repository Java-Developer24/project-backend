// serviceController.js
import axios from 'axios';

import Service from '../models/service.js';
import { userDiscountModel } from '../models/userDiscount.js'
import User from "../models/user.js"

import ServerData from '../models/serverData.js';
import Admin from '../models/mfa.js';
import { getIpDetails } from "../utils/getIpDetails.js";



// / Function to get margin and exchange rate from the database based on server number
const getServerData = async (serverNumber) => {
  console.log(`Fetching data for server ${serverNumber}...`);
  const serverData = await ServerData.findOne({ server: serverNumber }).select('margin exchangeRate'); // Fetch margin and exchange rate for the server
  if (!serverData) {
    console.error(`No data found for server ${serverNumber}`);
    return { margin: 0, exchangeRate: 1 }; // Default values in case data is not found
  }
  console.log(`Fetched margin: ${serverData.margin}, exchangeRate: ${serverData.exchangeRate} for server ${serverNumber}`);
  return serverData;  // Return the fetched data
};

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

const calculateUpdatedPrice = async (price, serverNumber) => {
  const serverData = await getServerData(serverNumber);  // Get margin and exchangeRate based on server number
  const { margin, exchangeRate } = serverData;

  // Perform the calculation without rounding prematurely
  const intermediatePrice = price * exchangeRate;; // Add margin to the price
  const updatedPrice = intermediatePrice+ margin   // Apply exchange rate

  // Round the final price to two decimal places after applying all calculations
  return Math.round(updatedPrice * 100) / 100;  // Round to two decimal places
};
// Function to sort servers by updated price
const sortServersByPrice = (servers) => {
  return servers.sort((a, b) => a.updatedPrice - b.updatedPrice);
};

// Function to sort services by name
const sortServicesByName = (services) => {
  return services.sort((a, b) => a.name.localeCompare(b.name));
};


const endpoints = [
  "https://phpfiles.paidsms.org/p/fastsms.php",
  "https://phpfiles.paidsms.org/p/5sim.php",
  "https://phpfiles.paidsms.org/p/smshub.php",
  "https://phpfiles.paidsms.org/p/grizzlysms.php",
  "https://phpfiles.paidsms.org/p/tempnumber.php",
  "https://phpfiles.paidsms.org/p/smsactivate.php",
  "https://phpfiles.paidsms.org/p/smsbower.php",
  "https://phpfiles.paidsms.org/p/cpay.php"
];

const callEndpoint = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data.trim();  // Assuming the response is a plain text like "ok" or "fail"
  } catch (error) {
    console.error(`Error calling endpoint ${url}:`, error);
    return 'fail';  // Return 'fail' on error
  }
};






 
// Core logic (can be used in both background and API routes)
const fetchAndStoreServicesCore = async () => {
  console.time("fetchAndStoreServices");

  
  // Store the results of each endpoint call
  let endpointResults = {};

  // Retry logic for endpoints
  const retryInterval = 2 * 60 * 1000; // 2 minutes in milliseconds
  let retryAttempts = 3;  // Retry up to 3 times for each endpoint
  let failedEndpoints = [...endpoints]; // Initially all endpoints are considered for retry

  const callAllEndpoints = async () => {
    let retryEndTime = Date.now() + retryInterval;

    // Retry failed endpoints until the retry interval is over
    while (failedEndpoints.length > 0 && Date.now() < retryEndTime) {
      const promises = failedEndpoints.map(async (endpoint) => {
        const result = await callEndpoint(endpoint);
        endpointResults[endpoint] = result;
        if (result === 'ok') {
          failedEndpoints = failedEndpoints.filter((e) => e !== endpoint);  // Remove successful endpoint
        }
      });
      await Promise.all(promises);
      if (failedEndpoints.length > 0) {
        console.log(`Waiting for retry... Remaining endpoints: ${failedEndpoints.join(', ')}`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds before retrying
      }
    }

    if (failedEndpoints.length > 0) {
      console.error(`Some endpoints failed after retries: ${failedEndpoints.join(', ')}`);
    } else {
      console.log('All endpoints were successfully called');
    }

    // Fetch the latest services data directly
    const response = await fetchDataWithRetry('https://phpfiles.paidsms.org/p/final.php');
    const servicesData = response;
    return servicesData;
  };

  try {
    
// Call all the endpoints first
const servicesData = await callAllEndpoints();
    if (!Array.isArray(servicesData)) {
     
      return { success: false, message: "Invalid data format" };
    }

    // Loop through and update each service in the database
    for (const serviceData of servicesData) {
      const { name, servers } = serviceData;

      if (!name || !servers) {
       
        continue;
      }

      const normalizedServiceName = normalizeName(name);

      // Process servers
      const parsedServers = await Promise.all(servers.map(async (server) => {
        const { server: serverValue, price: priceValue, ...rest } = server;
        const serverNumber = parseInt(serverValue);
        const price = parseFloat(priceValue);

        if (isNaN(price)) {
          
          return null;
        }

        const updatedPrice = await calculateUpdatedPrice(price, serverNumber);

        return {
          ...rest,
          serverNumber,
          price: updatedPrice,
        };
      }));

      const validServers = parsedServers.filter(server => server !== null);
      const sortedServers = sortServersByPrice(validServers);

      // Replace existing service or insert new one
      await Service.findOneAndUpdate(
        { name: normalizedServiceName }, // Find by normalized name
        { name: normalizedServiceName, servers: sortedServers }, // Replace with new data
        { upsert: true, new: true } // Create new if not found, return the updated document
      );
    }

    console.log("fetchAndStoreServices completed in", console.timeEnd("fetchAndStoreServices"))
    return { success: true, message: "Services fetched and stored successfully" };
    
  } catch (error) {
   
    return { success: false, message: "Error fetching services" };
  }

 
};



// API route handler
 const fetchAndStoreServices = async (req, res) => {
  const result = await fetchAndStoreServicesCore();

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(500).json({ message: result.message });
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

export const getServiceData = async (req, res) => {
   
  
    try {
      
      const response = await axios.get('https://phpfiles.paidsms.org/p/final.php', { timeout: 10000 });
     
  
      const servicesData = response.data;
  
      if (!Array.isArray(servicesData)) {
        console.error("Invalid service data format: Expected an array");
        return res.status(400).json({ message: "Invalid service data format." });
      }
  
      
  
      // Process the data
      const processedServices = await Promise.all(
        servicesData.map(async (serviceData) => {
          const { name, servers } = serviceData;
  
          if (!name || !Array.isArray(servers)) {
            console.warn(`Skipping invalid service entry: ${JSON.stringify(serviceData)}`);
            return null;
          }
  
          // Normalize the service name
          const normalizedServiceName = normalizeName(name);
  
          // Update and calculate prices for servers
          const parsedServers = await Promise.all(
            servers.map(async (server) => {
              const { server: serverValue, price: priceValue, ...rest } = server;
  
              // Validate server and price values
              const serverNumber = parseInt(serverValue, 10);
              const price = parseFloat(priceValue);
  
              if (isNaN(serverNumber) || isNaN(price)) {
                console.warn(`Skipping invalid server data: ${JSON.stringify(server)}`);
                return null;
              }
  
              try {
                // Get and apply the pricing formula
                const updatedPriceFormula = await getPricingFormula(serverNumber);
                const updatedPrice = updatedPriceFormula(price);
                const roundedPrice = parseFloat(updatedPrice.toFixed(2)); // Round to 2 decimal places
  
                return {
                  ...rest,
                  serverNumber,
                  price: roundedPrice,
                };
              } catch (error) {
                
                return null;
              }
            })
          );
  
          const validServers = parsedServers.filter(Boolean); // Remove invalid server entries
  
          // Sort servers by price
          const sortedServers = sortServersByPrice(validServers);
  
          return {
            name: normalizedServiceName,
            servers: sortedServers,
          };
        })
      );
  
      const validServices = processedServices.filter(Boolean); // Remove invalid service entries
  
     
  
      // Send the processed services as a response
      res.status(200).json({ services: validServices });
    } catch (error) {
     
      res.status(500).json({ message: "Failed to fetch and process services.", error: error.message });
    }
  };
  
  
  
//APi page of  user get services data  end point
const getUserServicesData = async (req, res) => {
  try {
    const { userId, api_key } = req.query;

    if (!api_key) {
      return res.status(400).json({ error: "API key is required" });
    }

    const apikeyrequest = await User.findOne({ apiKey: api_key });

    if (!apikeyrequest) {
      return res.status(400).json({ error: "Invalid API key" });
    }

    // Get the IP details of the request
    const admin = await Admin.findOne({});
      const apiAdminIp = admin?.adminIp;
    const isAdminIP =req.clientIp === apiAdminIp; // Compare request IP with stored admin IP

    // Fetch all services (admin gets all, non-admins get only active ones)
    const services = isAdminIP
      ? await Service.find().lean() // Admin gets all services
      : await Service.find({ maintenance: false }).lean(); // Non-admins get only active services

    if (!services || services.length === 0) {
      return res.status(404).json({ message: "No services found" });
    }

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
        let discount = 0;

        if (server.discount) {
          discount += server.discount;
        }

        const serviceKey = `${service.name}_${server.serverNumber}`;
        discount += userDiscountMap.get(serviceKey) || 0;

        const originalPrice = parseFloat(server.price);
        server.price = (originalPrice + discount).toFixed(2);

        return {
          serverNumber: server.serverNumber.toString(),
          price: server.price,
          code: service.name,
          
        };
      });

      // If admin IP, don't filter maintenance, otherwise exclude maintenance servers
      const filteredServers = isAdminIP
        ? updatedServers // Admin gets all servers
        : updatedServers.filter((server) => !server.maintenance); // Non-admins get only active servers

      return {
        name: service.name,
        servers: filteredServers.sort((a, b) => parseInt(a.serverNumber) - parseInt(b.serverNumber)), // Sort by server number
      };
    });

    // Sort services by name
    const sortedServices = servicesWithUpdatedPrice.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json(sortedServices);
  } catch (error) {
    console.error("Error getting services:", error);
    res.status(500).json({ message: "Error getting services", error: error.message });
  }
};

// const getUserServicesData = async (req, res) => {
//   try {
    

//     const { userId, api_key } = req.query;

//     // Validate api_key
//     if (!api_key) {
//       return res.status(400).json({ error: "API key is required" });
//     }

//     const apikeyrequest = await User.findOne({ apiKey:api_key });

//     if (!apikeyrequest) {
//       return res.status(400).json({ error: "Invalid API key" });
//     }

//    // Fetch all services that are not under maintenance
//    const services = await Service.find({ maintenance: false }).lean();
  

//    if (!services || services.length === 0) {
//      return res.status(404).json({ message: 'No services found' });
//    }

   

//    // Fetch the user-specific discount data
//    const userDiscountData = userId ? await userDiscountModel.find({ userId }) : [];

//    // Create a map for quick lookup of user-specific discounts by service and server
//    const userDiscountMap = new Map();
//    userDiscountData.forEach((discount) => {
//      const key = `${discount.service}_${discount.server}`;
//      userDiscountMap.set(key, discount.discount);
//    });

//    const servicesWithUpdatedPrice = services.map((service) => {
//      const updatedServers = service.servers.map((server) => {
//        // Initialize the discount at the server level
//        let discount = 0;

//       //  // Get the service-level discount if exists
//       //  if (service.discount) {
//       //    discount += service.discount; // Assuming the service model has a discount field
//       //  }

//        // Get the server-level discount if exists
//        if (server.discount) {
//          discount += server.discount;
//        }

//        // Get user-specific discount if exists
//        const serviceKey = `${service.name}_${server.serverNumber}`;
//        discount += userDiscountMap.get(serviceKey) || 0;

//        // Apply the discount directly to the server price
//        const originalPrice = parseFloat(server.price);
//        server.price = (originalPrice + discount).toFixed(2); // Directly update the price with discounts

//        return {
//          serverNumber: server.serverNumber.toString(), // Ensuring server number is a string
//          price: server.price,
//          code: service.name,
        
//        };
//      });

//      // Filter out servers under maintenance and sort by the adjusted price
//     // Filter out servers under maintenance and sort by server number (ascending order)
//     const filteredServers = updatedServers
//     .filter((server) => !server.maintenance)
//     .sort((a, b) => parseInt(a.serverNumber) - parseInt(b.serverNumber)); // Sort by server number

//      return {
//        name: service.name,
//        servers: filteredServers,
//        // Assuming `lowestPrice` is already part of the service model
//      };
//    });

  
//    // Sort services by name
//    const sortedServices = servicesWithUpdatedPrice.sort((a, b) => a.name.localeCompare(b.name));
   
//    res.status(200).json(sortedServices);
//   } catch (error) {
//     console.timeEnd("getServices");
//     console.error("Error getting services:", error);
//     res.status(500).json({ message: 'Error getting services', error: error.message });
//   }
// };



// const getUserServicesDatas = async (req, res) => {
//   try {
    
//     const { userId } = req.query;

//     // Fetch all services that are not under maintenance
//     const services = await Service.find({ maintenance: false }).lean();
   

//     if (!services || services.length === 0) {
//       return res.status(404).json({ message: 'No services found' });
//     }

  

//     // Fetch the user-specific discount data
//     const userDiscountData = userId ? await userDiscountModel.find({ userId }) : [];

//     // Create a map for quick lookup of user-specific discounts by service and server
//     const userDiscountMap = new Map();
//     userDiscountData.forEach((discount) => {
//       const key = `${discount.service}_${discount.server}`;
//       userDiscountMap.set(key, discount.discount);
//     });

//     const servicesWithUpdatedPrice = services.map((service) => {
//       const updatedServers = service.servers.map((server) => {
//         // Initialize the discount at the server level
//         let discount = 0;

//         // Get the service-level discount if exists
//         // if (service.discount) {
//         //   discount += service.discount; // Assuming the service model has a discount field
//         // }

//         // Get the server-level discount if exists
//         if (server.discount) {
//           discount += server.discount;
//         }

//         // Get user-specific discount if exists
//         const serviceKey = `${service.name}_${server.serverNumber}`;
//         discount += userDiscountMap.get(serviceKey) || 0;

//         // Apply the discount directly to the server price
//         const originalPrice = parseFloat(server.price);
//         server.price = (originalPrice + discount).toFixed(2); // Directly update the price with discounts

//         return {
//           serverNumber: server.serverNumber.toString(), // Ensuring server number is a string
//           price: server.price,
//           code: service.name,
//           otp: server.otp,
//           maintenance:server.maintenance
//         };
//       });

//       // Filter out servers under maintenance and sort by the adjusted price
//      // Filter out servers under maintenance and sort by server number (ascending order)
//      const filteredServers = updatedServers
//      .filter((server) => !server.maintenance)
//      .sort((a, b) => parseInt(a.serverNumber) - parseInt(b.serverNumber)); // Sort by server number

//       return {
//         name: service.name,
//         servers: filteredServers,
//         // Assuming `lowestPrice` is already part of the service model
//       };
//     });

    

  
//     // Sort services by name
//     const sortedServices = servicesWithUpdatedPrice.sort((a, b) => a.name.localeCompare(b.name));
   

    
//     res.status(200).json(sortedServices);
//   } catch (error) {
    
//     res.status(500).json({ message: 'Error getting services', error: error.message });
//   }
// };

const getUserServicesDatas = async (req, res) => {
  try {
    const { userId } = req.query;

    
     // Get the IP details of the request
     const admin = await Admin.findOne({});
     const apiAdminIp = admin?.adminIp;
   const isAdminIP =req.clientIp === apiAdminIp; // Compare request IP with stored admin IP

    // Fetch all services (admin gets all, non-admins get only active ones)
    const services = isAdminIP
      ? await Service.find().lean() // Admin gets all services
      : await Service.find({ maintenance: false }).lean(); // Non-admins get only active services

    if (!services || services.length === 0) {
      return res.status(404).json({ message: "No services found" });
    }

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
        let discount = 0;

        if (server.discount) {
          discount += server.discount;
        }

        const serviceKey = `${service.name}_${server.serverNumber}`;
        discount += userDiscountMap.get(serviceKey) || 0;

        const originalPrice = parseFloat(server.price);
        server.price = (originalPrice + discount).toFixed(2);

        return {
          serverNumber: server.serverNumber.toString(),
          price: server.price,
          code: service.name,
          otp: server.otp,
          maintenance: server.maintenance,
        };
      });

      // If admin IP, don't filter maintenance, otherwise exclude maintenance servers
      const filteredServers = isAdminIP
        ? updatedServers // Admin gets all servers
        : updatedServers.filter((server) => !server.maintenance); // Non-admins get only active servers

      return {
        name: service.name,
        servers: filteredServers.sort((a, b) => parseInt(a.serverNumber) - parseInt(b.serverNumber)), // Sort by server number
      };
    });

    // Sort services by name
    const sortedServices = servicesWithUpdatedPrice.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json(sortedServices);
  } catch (error) {
    res.status(500).json({ message: "Error getting services", error: error.message });
  }
};



const getUserServicesDataAdmin = async (req, res) => {
  try {
    
    const { userId } = req.query;
    

    // Fetch all services that are not under maintenance
    const services = await Service.find({ maintenance: false }).lean();
    

    if (!services || services.length === 0) {
     
      return res.status(404).json({ message: 'No services found' });
    }

   

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

        // // Get the service-level discount if exists
        // if (service.discount) {
        //   discount += service.discount; // Assuming the service model has a discount field
        // }

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

        return {
          serverNumber: server.serverNumber.toString(), // Ensuring server number is a string
          price: server.price,
          code: server.code,
          otp: server.otp,
          maintenance:server.maintenance
        };
      });

      // Filter out servers under maintenance and sort by the adjusted price
      const sortedServers = updatedServers

        .sort((a, b) => parseInt(a.serverNumber) - parseInt(b.serverNumber));// Sort by updated price directly

      return {
        ...service,
        servers: sortedServers,
      };
    });

   
    // Sort services by name
    const sortedServices = servicesWithUpdatedPrice.sort((a, b) => a.name.localeCompare(b.name));
   
    res.status(200).json(sortedServices);
  } catch (error) {
  
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
        const { name, serverNumber, maintenance } = req.body; // Input data from the frontend

        // Validate inputs
        if (!name || typeof serverNumber === 'undefined' || typeof maintenance !== 'boolean') {
            return res.status(400).json({ message: 'Service name, server number, and block status are required' });
        }

        // Find the service by name and update the specific server
        const updatedService = await Service.findOneAndUpdate(
            { name: name, "servers.serverNumber": serverNumber }, // Match service and server number
            { $set: { "servers.$.maintenance": maintenance } },                // Update the server's maintenance status
            { new: true }                                               // Return the updated document
        );

        if (!updatedService) {
            return res.status(404).json({ message: 'Service or server not found' });
        }

        res.status(200).json({
            message: `Server ${serverNumber} in service '${name}' updated successfully`,
            
        });
    } catch (error) {
        
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
        }const matchingServices = await Service.find({ "servers.serverNumber": serverNumber });
        console.log('Matching Services:', matchingServices);
        

        // Prepare the bulk update operation
        const bulkOps = [];


        bulkOps.push({
          updateMany: {
              filter: { 'servers.serverNumber': serverNumber },
              update: { $set: { 'servers.$.maintenance': maintenance } }
          }
      });
        // Create a bulk update operation for all services that contain the serverNumber
       

        if (bulkOps.length > 0) {
            // Execute the bulk write operation to update all services with the specified serverNumber
            const start = Date.now();
            const result = await Service.bulkWrite(bulkOps);
            await updateServerData(serverNumber, maintenance); // Ensure this function updates your ServerData model appropriately
            const end = Date.now();
            

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
        updateServerDatas(server,maintenance)
        // Validate the input
        if (server === undefined || maintenance === undefined) {
            return res.status(400).json({ message: 'Server and maintenance status are required' });
        }

        // Create an array of bulk write operations
        const bulkOps = [];

        // If a specific server is provided (e.g., server 2), update only that server
        if (server === 0) {
            // Update all servers 1-11 in maintenance
            for (let serverNumber = 1; serverNumber <= 8; serverNumber++) {
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
            await updateServerDatas(server, maintenance); // Ensure this function updates your ServerData model appropriately
            const end = Date.now();
           // Check the time for bulkWrite

            res.status(200).json({ message: 'Centralized update completed successfully' });
        } else {
            res.status(400).json({ message: 'No valid servers to update' });
        }
    } catch (error) {
        console.error('Error updating servers centrally:', error);
        res.status(500).json({ message: 'Error updating servers centrally', error: error.message });
    }
};


const updateServerDatas = async (server, maintenance) => {

  try {
    if (server === 0) {
      // Update maintenance for all servers from 0 to 8
      await ServerData.updateMany(
        { server: { $in: [0, 1, 2, 3, 4, 5, 6, 7, 8] } }, // Match servers from 0 to 8
        { $set: { maintenance: maintenance } }, // Update maintenance status
        { upsert: true } // Create documents if they don't exist
      );
      console.log({ message: "All servers from 0 to 8 set under maintenance" });
    } else {
      // Update maintenance for the specified server
      await ServerData.updateOne(
        { server: server }, // Find the document by server number
        { $set: { maintenance: maintenance } }, // Update maintenance status
        { upsert: true } // Create document if it doesn't exist
      );
      console.log({ message: "Server set under maintenance" });
    }
  } catch (error) {
    console.error("Error updating ServerData:", error);
    res.status(500).json({ error: "Error updating ServerData" });
  }
};

// Function to update ServerData model for a given server number and maintenance status
const updateServerData = async (server, maintenance) => {
  try {
    // Update ServerData for the given serverNumber
    await ServerData.updateOne(
      { server: server },  // Find the document by serverNumber
      { $set: { maintenance: maintenance } },  // Update maintenance status
      { upsert: true }  // If the document doesn't exist, it will be created
    );
  } catch (error) {
    console.error('Error updating ServerData:', error);
    throw new Error('Error updating ServerData');
  }
};


export const updateServiceDiscount = async (req, res) => {
  try {
      const { service, server, discount,  } = req.body;  // Extract service name, server number, discount, and service-level discount from payload

      // Validate the input
      if (!service || !server || discount === undefined ) {
          return res.status(400).json({ message: 'Service name, server number, discount, and service-level discount are required' });
      }

      // Perform the update operation to set the discount for the specific server in the service
      const result = await Service.updateOne(
          { name: service, "servers.serverNumber": server }, // Filter by service name and server number
          {
              $set: {
                  "servers.$[elem].discount": discount,  // Set discount for the specific server
                  discount: discount // Set service-level discount
              }
          },
          {
              arrayFilters: [{ "elem.serverNumber": server }], // Target the specific server in the servers array
              new: true
          }
      );

      // Check if the update operation was successful
      if (result.modifiedCount === 0) {
          return res.status(404).json({ message: 'Service or server not found or no discount updated' });
      }

      res.status(200).json({
          message: `Discount of ${discount} applied to server ${server} in the service ${service}. Service-level discount of ${discount} also applied.`
      });
  } catch (error) {
      console.error('Error updating service server discount:', error);
      res.status(500).json({ message: 'Error updating service server discount', error: error.message });
  }
};


// export const getAllServiceDiscounts = async (req, res) => {
//   try {
//       // Aggregation pipeline to efficiently filter and format the data
//       const discounts = await Service.aggregate([
//           // Unwind the servers array so we can work with individual server data
//           { $unwind: "$servers" },
//           // Match servers where discount is not null
//           { $match: { "servers.discount": { $ne: null } } },
//           // Project the necessary fields for the response
//           {
//               $project: {
//                   _id: 1,
//                   name: 1,
//                   "servers.serverNumber": 1,
//                   "servers.discount": 1,
//                   createdAt: 1,
//                   updatedAt: 1
//               }
//           },
//           // Format the data to the desired structure
//           {
//               $project: {
//                   id: "$_id",
//                   service: "$name",
//                   server: "$servers.serverNumber",
//                   discount: "$servers.discount",
//                   createdAt: 1,
//                   updatedAt: 1
//               }
//           }
//       ]);

//       // If there are no valid discounts, return an empty array
//       if (discounts.length === 0) {
//           return res.status(200).json([]);  // Return empty array if no valid discounts
//       }

//       // Send the valid discount data as the response
//       return res.status(200).json(discounts);

//   } catch (error) {
//       console.error('Error getting discounts:', error);
//       return res.status(500).json({ message: 'Internal server error.', error: error.message });
//   }
// };

export const getAllServiceDiscounts = async (req, res) => {
  try {
      // Aggregation pipeline to fetch all relevant data
      const discounts = await Service.aggregate([
          // Unwind the servers array to handle individual servers
          { $unwind: "$servers" },
          // Project the necessary fields for response
          {
              $project: {
                  _id: 1,
                  name: 1,
                  "servers.serverNumber": 1,
                  "servers.discount": 1,
                  discount: 1, // Service-level discount
                  createdAt: 1,
                  updatedAt: 1
              }
          },
          // Format the data to the desired structure
          {
              $project: {
                  id: "$_id",
                  service: "$name",
                  serviceLevelDiscount: "$discount",  // Service-level discount
                  server: "$servers.serverNumber",
                  discount: "$servers.discount",  // Server-level discount
                  createdAt: 1,
                  updatedAt: 1
              }
          }
      ]);

      // Filter out records where serviceLevelDiscount or serverLevelDiscount is null or 0
      const validDiscounts = discounts.filter(discount => 
          discount.serviceLevelDiscount !== null && discount.serviceLevelDiscount !== 0 &&
          discount.discount !== null && discount.discount !== 0
      );

      // If no valid discounts are found, return an empty array
      if (validDiscounts.length === 0) {
          return res.status(200).json([]);
      }

      // Send the valid discount data as the response
      return res.status(200).json(validDiscounts);

  } catch (error) {
      console.error('Error getting discounts:', error);
      return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};



export const deleteServiceDiscount = async (req, res) => {
  try {
      const { service, server } = req.query;  // Get service name and server number from query

      // Validate payload
      if (typeof service === 'undefined' || typeof server === 'undefined') {
          return res.status(400).json({ message: 'Service and server fields are required.' });
      }

      // Find the service by name and update both the service discount and the server discount to null
      const updatedService = await Service.findOneAndUpdate(
          { 
              name: service,  // Find the service by name
              'servers.serverNumber': server  // Ensure the specific server exists in the servers array
          },
          { 
              $set: { 
                  'discount': null,  // Set the service-level discount to null
                  'servers.$.discount': null  // Set the server-level discount to null
              }
          },
          { new: true }  // Return the updated document
      );

      if (!updatedService) {
          return res.status(404).json({ message: `Service ${service} or Server ${server} not found.` });
      }

      return res.status(200).json({ message: `Discounts set to null for service ${service} and server ${server}.` });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};




export const getMaintenanceStatusForServer = async (req, res) => {
  try {
    // Fetch maintenance status for server 0
    const serverData = await ServerData.findOne({ server: 0 });

    if (!serverData) {
      return res.status(404).json({ message: "Server 0 not found" });
    }

    // Get the admin IP from the database
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ message: "Admin not found in the database" });
    }

    // Get the user's IP address from the middleware
    const userIp = req.clientIp;

    // Check if maintenance is on
    if (serverData.maintenance) {
      // If IP matches the admin's IP, allow access
      if (userIp === admin.adminIp) {
        return res.status(200).json({
          maintainance: true, // Maintenance is on
          adminAccess: true, // Admin is allowed to access
          message: "Admin access granted during maintenance.",
        });
      }

      // If IP does not match, block access
      return res.status(200).json({
        maintainance: true,
        message: "The site is under maintenance.",
      });
    }

    // If maintenance is not on, return the status as normal
    return res.status(200).json({
      maintainance: false,
    });
  } catch (error) {
    console.error("Error fetching maintenance status for server 0:", error);
    return res.status(500).json({
      message: "Error fetching maintenance status",
      error: error.message,
    });
  }
};



export default {
    fetchAndStoreServices,
    fetchAndStoreServicesCore,
    getUserServicesDatas,
    getUserServicesDataAdmin,
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
    getServiceData,
    getMaintenanceStatusForServer,
    updateServerDatas
};