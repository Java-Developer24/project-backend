
import moment from "moment-timezone";
import { v4 as uuidv4 } from 'uuid';

import Service from '../models/service.js';
import { NumberHistory } from "./../models/history.js";
import User from "../models/user.js";
import { userDiscountModel } from '../models/userDiscount.js';
import { getIpDetails } from "../utils/getIpDetails.js";
import Admin from '../models/mfa.js';
import { Order } from "./../models/order.js";
import fetch from "node-fetch";
import ServerData from "../models/serverData.js";
import axios from "axios"

import {

    numberGetDetails,
    otpGetDetails,
    numberCancelDetails
   
  } from "../utils/telegram-service.js";
import { runFraudCheck } from "../utils/blockUsersFraud.js";


const getServerData = async (sname, server) => {
    const serverList = await Service.findOne({
      "servers.serverNumber": parseInt(server),
      name: sname,
    });
    if (!serverList) {
      throw new Error("Service not found for the specified server.");
    }
    const serverData = serverList.servers.find(
      (s) => s.serverNumber === parseInt(server)
    );
    if (!serverData) {
      throw new Error(`Server ${server} is not found.`);
    }
    return serverData;
  };
  
  
 
  
  
  
  
export const checkServiceAvailabilitydata = async (req, res) => {
  try {
      // Fetch service data from the database
      const { code, server } = req.query;
      console.log(code)
      console.log(server)
      const serviceData = await Service.findOne({ name: code }).lean();
      console.log(serviceData)
      if (!serviceData) {
          return res.status(404).json({ error: 'Service not found' });
      }

      // Check if the entire service is under maintenance
      if (serviceData.maintenance) {
          return res.status(503).json({ error: 'server not available' });
      }
      
      // Check if the specified server is under maintenance
      const serverData = serviceData.servers.find(s => s.serverNumber === Number(server));
      console.log(serverData)
      if (!serverData) {
          return res.status(404).json({ error: 'server not found' });
      }

      if (serverData.maintenance) {
          return res.status(503).json({ error: 'server not available' });
      }
      
      return res.status(200).json({ success: 'server available', data: serverData });
  } catch (error) {
      return { error: error.message || 'An error occurred' };
  }
};
const checkServiceAvailability = async (sname, server) => {
  try {
      // Fetch service data from the database
      const serviceData = await Service.findOne({ name: sname }).lean();
      
      if (!serviceData) {
          return { error: 'Service not found' };
      }

      // Check if the entire service is under maintenance
      if (serviceData.maintenance) {
          return { error: 'server not available' };
      }
      
      // Check if the specified server is under maintenance
      const serverData = serviceData.servers.find(s => s.serverNumber === Number(server));
      if (!serverData) {
          return { error: 'server not found' };
      }

      if (serverData.maintenance) {
          return { error: 'server not available' };
      }
      
      return { success: 'server available', data: serverData };
  } catch (error) {
      return { error: error.message || 'An error occurred' };
  }
};


  // Helper function to get API key and check maintenance
  const getServerMaintenanceData = async (server) => {
    // Check if the server is under maintenance
    const maintainanceServerData = await ServerData.findOne({ server: 0 });
    if (maintainanceServerData.maintenance) {
      throw new Error("Site is under maintenance.");
    }
  
    const serverData = await ServerData.findOne({ server });
    if (!serverData) {
      throw new Error("Server data not found.");
    }
  
    if (serverData.maintenance) {
      throw new Error(`Server ${server} is under maintenance.`);
    }
  
    return serverData;
  };
  
  // Helper function to construct API URL
  const constructApiUrl = (server, api_key_server, data) => {
    switch (server) {
      case "1":
        return `https://fastsms.su/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&country=22`;
  
      case "2":
        return {
          url: `https://5sim.net/v1/user/buy/activation/india/virtual21/${data.code}`,
          headers: {
            Authorization: `Bearer ${api_key_server}`,
            Accept: "application/json",
          },
        };
  
      case "3":
        return `https://smshub.org/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&operator=any&country=22&maxPrice=${data.price}`;
  
     
  
      case "4":
        return `https://api.grizzlysms.com/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&country=22`;
  
      case "5":
        return `https://tempnum.org/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&country=22`;
  
        case "7":
          return `  https://smsbower.online/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&country=22&maxPrice=${data.price} `;
         
        case "6":
          return `https://api.sms-activate.guru/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&operator=any&country=22`;
  
      case "8":
        return `http://www.phantomunion.com:10023/pickCode-api/push/buyCandy?token=${api_key_server}&businessCode=${data.code}&quantity=1&country=IN&effectiveTime=10`;
      
      default:
        throw new Error("Invalid server value.");
    }
  };
  
  // Helper function to handle response data
  const handleResponseData = (server, responseData) => {
    try {
      switch (server) {
        case "1":
          const parts = responseData.split(":");
  
          return { id: parts[1], number: parts[2].substring(2) };
  
        case "2":
          const jsonResponse = JSON.parse(responseData);
  
          return {
            id: jsonResponse.id,
            number: jsonResponse.phone.replace("+91", ""),
          };
  
        case "3":
          const response3parts = responseData.split(":");
  
          return {
            id: response3parts[1],
            number: response3parts[2].substring(2),
          };
  
  
        case "4":
          const response4parts = responseData.split(":");
  
          return {
            id: response4parts[1],
            number: response4parts[2].substring(2),
          };
  
        case "5":
          const response5parts = responseData.split(":");
  
          return {
            id: response5parts[1],
            number: response5parts[2].substring(2),
          };
  
        case "7":
          const response7parts = responseData.split(":");
  
          return {
            id: response7parts[1],
            number: response7parts[2].substring(2),
          };
  
        case "6":
          const response6parts = responseData.split(":");
  
          return {
            id: response6parts[1],
            number: response6parts[2].substring(2),
          };
  
          case "8":
            const responseDataJson = JSON.parse(responseData);
            
            const phoneData = responseDataJson.data.phoneNumber[0];
            
            return {
              id: phoneData.serialNumber,
              number: phoneData.number.replace("+91", ""),  // Remove country code (+91)
            };
          
        
  
  
        default:
          throw new Error("No numbers available. Please try different server.");
      }
    } catch (error) {
      console.log(error);
      throw new Error("No numbers available. Please try different server.");
    }
  };
  
  // Helper function to calculate discounts
  const calculateDiscounts = async (userId, sname, server) => {
    let totalDiscount = 0;
  console.log("userId",userId)
  console.log("sname",sname)
  console.log("server",server)
    // User-specific discount
    const userDiscount = await userDiscountModel.findOne({
      userId,
      service: sname,
      server,
    });
    console.log("userDiscount",userDiscount);
    if (userDiscount) {
      totalDiscount += parseFloat(userDiscount.discount.toFixed(2));
    }
  
    // Service discount (retrieve the service with its servers and find the specific server's discount)
    const serviceDiscount = await Service.findOne({
      service: sname,
      
    });
    
    if (serviceDiscount) {
      // Find the exact server inside the servers array
      const serverData = serviceDiscount.servers.find(
        (s) => s.serverNumber === parseInt(server)
      );
    console.log("serverDatadiscount",serverData)
      if (serverData?.discount !== null) {
        totalDiscount += parseFloat(serverData.discount.toFixed(2));
      }
    }
    // Server discount
    const serverDiscount = await Service.findOne({ server });
    console.log("serverDiscount", serverDiscount);
    if (serverDiscount) {
      totalDiscount += parseFloat(serverDiscount.discount.toFixed(2));
    }
  console.log("totalDiscount",totalDiscount);
    // Ensure the final totalDiscount is also in the correct format
    return parseFloat(totalDiscount.toFixed(2));
  };
  

  
  
  
  const requestQueue = [];
const MAX_WORKERS = 100; // Adjust the number of workers based on your needs
let activeWorkers = 0;

const enqueueRequest = (requestHandler) => {
  requestQueue.push(requestHandler);
  processQueue();
};

const processQueue = async () => {
  if (activeWorkers >= MAX_WORKERS || requestQueue.length === 0) return;

  activeWorkers++;
  const currentRequestHandler = requestQueue.shift();

  try {
    await currentRequestHandler();
  } catch (error) {
    
  } finally {
    activeWorkers--;
    processQueue();
  }
};
  
const getNumber = (req, res) => {
  enqueueRequest(() => handleGetNumberRequest(req, res));
};
  
  // Main logic to handle getting a number request and running fraud checks
  const handleGetNumberRequest = async (req, res) => {
    try {
      const { code, api_key, server} = req.query;
  
      if (!code || !api_key || !server) {
        return res
          .status(400)
          .json({ error: "api key or code missing or server number missing" });
      }
      const userapikey = await User.findOne({ apiKey:api_key });
      if (!userapikey) {
        return res.status(400).json({ error: "bad key or id missing" });
      }
  
      
      const ipDetails = await getIpDetails(req);
      const admin = await Admin.findOne({});
      const apiAdminIp = admin?.adminIp;
      const isAdmin = req.clientIp === apiAdminIp;
  
      const serverCode = await Service.findOne({name: code });
      if (!serverCode) {
        throw new Error("Service not found.");
      }
  
      const sname = serverCode.name;
  
      const user = await User.findOne({apiKey: api_key });
       // Run fraud check for the user before proceeding
    await runFraudCheck(user._id,ipDetails);  // Pass the userId to the fraud check function
      if (!user) {
        return res.status(400).json({ error: "Invalid API key." });
      }
  
      const userData = await User.findById({ _id: user._id });
      if (userData.blocked) {
        return res
          .status(400)
          .json({ error: "Your account is blocked, contact the Admin." });
      }
     
      let serverDatas = await ServerData.findOne({ server });
      if (!isAdmin) {
         serverDatas = await getServerMaintenanceData(server);
    }
    
      
      const api_key_server = serverDatas.api_key;
      if(!isAdmin){
        const serviceDataMaintence=await checkServiceAvailability(sname, server);
        if(serviceDataMaintence.error){
          return res.status(400).json({ error: serviceDataMaintence.error });
        }
      }
      
      
  
      const serviceData = await getServerData(sname, server);
      console.log("serverdata",serviceData)
      
      let price = parseFloat(serviceData.price);
  
      if (user.balance < price) {
        return res.status(400).json({ error: "low balance." });
      }
      
      const apiUrl = constructApiUrl(server, api_key_server, serviceData);
      console.log("serverdata",serviceData)
  
      let response, responseData;
      let retry = true;
  
      for (let attempt = 0; attempt < 2 && retry; attempt++) {
        if (typeof apiUrl === "string") {
          response = await fetch(apiUrl);
        } else {
          response = await fetch(apiUrl.url, { headers: apiUrl.headers });
        }
  
        if (!response.ok) {
          console.log('Error status:', response.status);  // Log status code for debugging
          throw new Error("No numbers available. Please try different server.");
        }
        
        responseData = await response.text();
        console.log('API Response Data:', responseData);
  
        if (!responseData ||responseData.trim() === "") {
          throw new Error("No numbers available. Please try a different server.");
        }
  
        try {
          var { id, number } = handleResponseData(server, responseData);
          retry = false;
        } catch (error) {
          
          if (attempt === 1) {
            return res.status(400).json({
              // error: "No numbers available. Please try different server.",
              error: "No stock.",
            });
          }
        }
      }
      console.log("user.userId",user._id)
      console.log("number",number)
      const totalDiscount = await calculateDiscounts(user._id, sname, server);
      console.log("totalDiscount from handle get number request ",totalDiscount);
      console.log("actual price",price)
      // const Originalprice = parseFloat((price + totalDiscount).toFixed(2));
      price=parseFloat((price + totalDiscount).toFixed(2))
      console.log("price after discount", price)
      
      // Update balance in the database using MongoDB $inc operator
      await User.updateOne(
        { _id: user._id },
        { $inc: { balance: -price } }
      );
      
      
      
  
      const formattedDateTime = moment().tz("Asia/Kolkata").format("DD/MM/YYYY HH:mm:ss A");
      const uniqueID = moment().tz("Asia/Kolkata").format("DDMMYYYYHHmmssSSS");



         const Id = uniqueID;
      



  
      const numberHistory = new NumberHistory({
        userId: user._id,
        serviceName: sname,
        price,
        server,
        id,
        Id, 
        otp: null,
        status: "Success",
        reason:"Waiting for SMS",
        number,
        date_time: formattedDateTime,
      });
      await numberHistory.save();
  console.log("serviceData code",serviceData.code)
  const balance=await User.findOne( { _id: user._id });
  console.log("remaining balance",balance.balance.toFixed(2))
      const { city, state, pincode, country, serviceProvider, ip } = ipDetails;
      const ipDetailsString = `\nCity: ${city}\nState: ${state}\nPincode: ${pincode}\nCountry: ${country}\nService Provider: ${serviceProvider}\nIP: ${ip}`;
      const userBalance= await User.findOne({ apiKey:api_key });
      await numberGetDetails({
        email: user.email,
        serviceName: sname,
        code: serviceData.code,
        price,
        server,
        number,
        balance: balance.balance.toFixed(2),
        ip: ipDetailsString,
      });
  
      const expirationTime = new Date();
      // Check if it's server 7, set 10 minutes; otherwise, set 20 minutes
      console.log("server",server)
      const expirationMinutes = server === "7" ? 10 : 20;
      console.log("expirationMinutes",expirationMinutes)
      const expirationTimeUTC =expirationTime.setMinutes(expirationTime.getMinutes() + expirationMinutes);
      const expirationTimeIST = moment(expirationTimeUTC).tz("Asia/Kolkata").format("DD/MM/YYYY HH:mm:ss A");
      console.log("expirationTimeUTC converted ",expirationTimeIST)
  
      const newOrder = new Order({
        userId: user._id,
        service: sname,
        price,
        server,
        Id,
        otpType:serviceData.otp,
        numberId: id,
        number,
        orderTime: new Date(),
        expirationTime,
      });
      await newOrder.save();
  
      res.status(200).json({ number, Id });
    } catch (error) {
     
      res.status(500).json({ error: error.message });
    }
  };
  



  const checkAndCancelExpiredOrders = async () => {
    try {
      const currentTime = new Date();
     
  
      // Fetch orders expiring within TIME_OFFSET or already expired
      const expiredOrders = await Order.find({
        expirationTime: { $lte: new Date(currentTime.getTime() + 120000) },
      });
  
     ;
  
      for (const order of expiredOrders) {
       
  
        const expirationTime = new Date(order.expirationTime);
        // Deduct 60000 milliseconds (1 minute) from the actual expiration time
        const timeDifference = expirationTime.getTime() - currentTime.getTime() - 120000;
        
  
        if (timeDifference <= 0) {
          // Immediately cancel already expired orders
         
          await cancelOrder(order);
        } else if (timeDifference <= TIME_OFFSET) {
          // Schedule cancellation for orders expiring within TIME_OFFSET
        
          setTimeout(() => cancelOrder(order), timeDifference);
        } else {
          
        }
      }
    } catch (error) {
     
    }
  };
  
  export const cancelOrder = async (order) => {
    try {
      
  
      const user = await User.findOne({ _id: order.userId });
      
  
      if (user && user.apiKey) {
        
        await callNumberCancelAPI(user.apiKey, order.Id);
      } else {
        
      }
    } catch (error) {
      
    }
  };
  
  const callNumberCancelAPI = async (apiKey, Id) => {
    try {
     
      
  
      const response = await fetch(
        `${process.env.BACKEND_URL}/api/service/cancel-number?api_key=${apiKey}&Id=${Id}`
      );
  
    
  
      if (!response.ok) {
        const errorResponse = await response.json();
        
      } else {
        console.log("API call successful");
      }
    } catch (error) {
      
    }
  };
  
  

  
 





  const getOtp = async (req, res) => {
    try {
      const { Id, api_key } = req.query;
      
      
  
      if (!Id || !api_key ) {
        return res
          .status(400)
          .json({ error: "bad key or id missing " });
      }
      const admin = await Admin.findOne({});
      const apiAdminIp = admin?.adminIp;
      const isAdmin = req.clientIp === apiAdminIp;

      if(!isAdmin){
    const maintainanceServerData = await ServerData.findOne({ server: 0 });
    if (maintainanceServerData.maintenance) {
      return res.status(400).json({error:"Site is under maintenance."});
    }}
  
      const userapikey = await User.findOne({ apiKey:api_key });
      if (!userapikey) {
        return res.status(400).json({ error: "bad key or id missing" });
      }
      // Check if the transaction with the given Id exists and its status
    const transactions = await NumberHistory.findOne({ Id });
    console.log(transactions)
    if (!transactions) {
      return res.status(404).json({ error: "Transaction not found." });
    }

    if (transactions.status === "Cancelled") {
      return res.status(400).json({ otp: "number cancelled" });
    }
    
  
      let apiUrl;
      let headers;
  
      const user = await User.findOne({ apiKey:api_key });
      if (!user) {
        return res.status(400).json({ error: "Invalid api key." });
      }
      
      
      const userData = await User.findById({ _id: user._id });
      // Fetch the actual ID based on the provided request ID
    const transaction = await NumberHistory.findOne({ Id: Id }); // Fetch the actual ID from the database
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found." });
    }
    const id = transaction.id; // Get the actual ID from the transaction data
    const server=transaction.server
    const sname=transactions.serviceName
    
    const serviceData = await getServerData(sname, server);
    let serverData = await ServerData.findOne({ server }); 
    
      // Check server maintenance and get API key
      if (!isAdmin) {
         serverData = await getServerMaintenanceData(server);
    }
     
      const api_key_server = serverData.api_key; // Fetch API key from ServerModel
     
  
      switch (server) {
        case "1":
          apiUrl = `https://fastsms.su/stubs/handler_api.php?api_key=${api_key_server}&action=getStatus&id=${id}`;
          break;
  
        case "2":
          apiUrl = `https://5sim.net/v1/user/check/${id}`;
          headers = {
            Authorization: `Bearer ${api_key_server}`,
            Accept: "application/json",
          };
          break;
  
        case "3":
          apiUrl = `https://smshub.org/stubs/handler_api.php?api_key=${api_key_server}&action=getStatus&id=${id}`;
          break;
  
      
  
        case "4":
          apiUrl = `https://api.grizzlysms.com/stubs/handler_api.php?api_key=${api_key_server}&action=getStatus&id=${id}`;
          break;
  
        case "5":
          apiUrl = `https://tempnum.org/stubs/handler_api.php?api_key=${api_key_server}&action=getStatus&id=${id}`;
          break;
  
        case "7":
          apiUrl = `https://smsbower.online/stubs/handler_api.php?api_key=${api_key_server}&action=getStatus&id=${id}`;
          break;
  
        case "6":
          apiUrl = `https://api.sms-activate.guru/stubs/handler_api.php?api_key=${api_key_server}&action=getStatus&id=${id}`;
          break;
  
        case "8":
          apiUrl = `http://www.phantomunion.com:10023/pickCode-api/push/sweetWrapper?token=${api_key_server}&serialNumber=${id}`;
          break;
       
        default:
          return res.status(400).json({ error: "Invalid server value." });
      }
  
      // Fetch data from the API URL
      const response = await fetch(apiUrl, { headers });
        console.log(id)
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
  
      const responseData = await response.text();
      console.log("response data",responseData)
  
      if (!responseData ) {
        throw new Error("Received empty response data.");
      }
  
      let responseDataJson;
      let validOtp;
      console.log(id)

  
      switch (server) {
        case "1":
          // Check if the response data includes "OK" followed by the OTP
          if (responseData.startsWith("STATUS_OK")) {
            // Split the response data to extract the OTP
            const parts = responseData.split(":");
            const otp = parts[1]; // Trim to remove any leading or trailing spaces
  
            validOtp = otp;
          }
          break;
          case "2":
            responseDataJson = JSON.parse(responseData);
            if (responseDataJson.sms && responseDataJson.sms.length > 0) {
              const latestSms = responseDataJson.sms.sort(
                (a, b) => new Date(b.date) - new Date(a.date)
              )[0];
              validOtp = latestSms.text;
            }
            break;
          
       
        case "3":
          // Check if the response data includes "OK" followed by the OTP
          if (responseData.startsWith("STATUS_OK")) {
            // Split the response data to extract the OTP
            const parts = responseData.split(":");
            const otp = parts[1]; // Trim to remove any leading or trailing spaces
  
            validOtp = otp;
          }
          break;
  
        case "4":
          // Check if the response data includes "OK" followed by the OTP
          if (responseData.startsWith("STATUS_OK")) {
            // Split the response data to extract the OTP
            const parts = responseData.split(":");
            const otp = parts[1]; // Trim to remove any leading or trailing spaces
  
            validOtp = otp;
          }
          break;
  
          case "5":
            try {
              // Check if the response data starts with "STATUS_OK"
              if (responseData.startsWith("STATUS_OK")) {
                // Split the response data to extract the part after "STATUS_OK:"
                const parts = responseData.split(":");
                const messageText = parts[1]?.trim(); // Trim to remove any leading or trailing spaces
          
                
          
                if (messageText) {
                  validOtp = messageText; // Store the extracted OTP
                } else {
                  console.log("No OTP found in the STATUS_OK message.");
                  validOtp = null; // No OTP found
                }
              } else if (responseData.startsWith("STATUS_WAIT_CODE")) {
                console.log("Waiting for SMS...");
                validOtp = null; // No OTP yet, waiting for SMS
              } else if (responseData.startsWith("STATUS_CANCEL")) {
                console.log("Activation canceled.");
                validOtp = null; // Activation was canceled
              } else {
                console.log("Unexpected response status.");
                validOtp = null; // Handle unexpected response
              }
            } catch (error) {
              
              throw new Error("Failed to process the OTP response for case 6.");
            }
            break;
          
            case "7":
              try {
                // Check if the response data starts with "STATUS_OK"
                if (responseData.startsWith("STATUS_OK"||"STATUS_WAIT_RETRY")) {
                  // Split the response data to extract the part after "STATUS_OK:"
                  const parts = responseData.split(":");
                  const messageText = parts[1]?.trim(); // Trim to remove any leading or trailing spaces
            
                  
            
                  if (messageText) {
                    validOtp = messageText; // Store the extracted OTP
                  } else {
                    console.log("No OTP found in the STATUS_OK message.");
                    validOtp = null; // No OTP found
                  }
                } else if (responseData.startsWith("STATUS_WAIT_CODE")) {
                  console.log("Waiting for SMS...");
                  validOtp = null; // No OTP yet, waiting for SMS
                } else if (responseData.startsWith("STATUS_CANCEL")) {
                  console.log("Activation canceled.");
                  validOtp = null; // Activation was canceled
                } else {
                  console.log("Unexpected response status.");
                  validOtp = null; // Handle unexpected response
                }
              } catch (error) {
                
                throw new Error("Failed to process the OTP response for case 6.");
              }
              break;
            
       
  
      
              case "6":
                try {
                  // Check if the response data starts with "STATUS_OK"
                  if (responseData.startsWith("STATUS_OK"||"STATUS_WAIT_RETRY")) {
                    // Split the response data to extract the part after "STATUS_OK:"
                    const parts = responseData.split(":");
                    const messageText = parts[1]?.trim(); // Trim to remove any leading or trailing spaces
              
                    
              
                    if (messageText) {
                      validOtp = messageText; // Store the extracted OTP
                    } else {
                      console.log("No OTP found in the STATUS_OK message.");
                      validOtp = null; // No OTP found
                    }
                  } else if (responseData.startsWith("STATUS_WAIT_CODE")) {
                    console.log("Waiting for SMS...");
                    validOtp = null; // No OTP yet, waiting for SMS
                  } else if (responseData.startsWith("STATUS_CANCEL")) {
                    console.log("Activation canceled.");
                    validOtp = null; // Activation was canceled
                  } else {
                    console.log("Unexpected response status.");
                    validOtp = null; // Handle unexpected response
                  }
                } catch (error) {
                  
                  throw new Error("Failed to process the OTP response for case 6.");
                }
                break;
              
         
  
          case "8":
            try {
              // Parse the response data as JSON
              const responseDataJson = JSON.parse(responseData);
          
              // Check if `verificationCode` and its first element exist
              if (
                responseDataJson?.data?.verificationCode &&
                responseDataJson.data.verificationCode.length > 0
              ) {
                const vcText = responseDataJson.data.verificationCode[0]?.vc?.trim(); // Get and trim `vc`
          
                
          
                  if (vcText) {
                    validOtp = vcText; // Store the extracted OTP
                  } else {
                    console.log("No OTP found in the vc field.");
                    validOtp = null; // No OTP found in `vc`
                  }
                } 
            } catch (error) {
             
              throw new Error("Failed to process the OTP response for case 9.");
            }

            
            break;
          
        
          

  
        default:
          return res.status(400).json({ error: "Invalid server value." });
      }
      console.log("otp",validOtp)
      if (validOtp) {
       
        const existingEntry = await NumberHistory.findOne({
          id,
          otp: validOtp,
      });
        console.log("Existing Entry:", existingEntry);
      
        if (!existingEntry) {
          // Fetch transaction data
          const transaction = await NumberHistory.findOne({ id });
          console.log("Transaction:", transaction);
      
          if (!transaction) {
            return res.status(404).json({ error: "Transaction not found." });
          }
      
          // Format the current date and time
          const formattedDateTime = moment().tz("Asia/Kolkata").format("DD/MM/YYYY HH:mm A");
      
         
      
          // Create and save the new entry
          // Update the existing entry with the new OTP and reason
  const updatedEntry = await NumberHistory.updateOne(
    { id }, // Find the existing entry based on id
    {
      $set: {
        otp: validOtp, // Update the OTP field
        reason: "SMS Received", // Update the reason field
      },
    }
  );
         
          
          // Fetch IP details using the getIpDetails function
        const ipDetails = await getIpDetails(req);
        // Destructure IP details
        const { city, state, pincode, country, serviceProvider, ip } =
          ipDetails;

        // Pass the destructured IP details to the numberGetDetails function as a multiline string
        const ipDetailsString = `\nCity: ${city}\nState: ${state}\nPincode: ${pincode}\nCountry: ${country}\nService Provider: ${serviceProvider}\nIP: ${ip}`;
console.log("service code form otp",serviceData.code)
        await otpGetDetails({
          email: userData.email,
          serviceName: transaction.serviceName,
          code: serviceData.code,
          price: transaction.price,
          server,
          number: transaction.number,
          otp: validOtp,
          ip: ipDetailsString,
        }); 
        }
      }
      
      // Automatically trigger the next OTP URL for server 1
      if (server === "1" && validOtp) {
        setTimeout(async () => {
          try {
            const nextOtpResponse = await fetch(
              `https://fastsms.su/stubs/handler_api.php?api_key=${api_key_server}&action=setStatus&id=${id}&status=3`
            );
  
            if (!nextOtpResponse.ok) {
              throw new Error("Network response was not ok");
            }
  
            const nextOtpResponseData = await nextOtpResponse.text();
            console.log("nextotp:", nextOtpResponseData);
          } catch (nextOtpError) {
           
          }
        }, 1000); // Adjust the delay as needed
      }
  
      // Automatically trigger the next OTP URL for server 3
      if (server === "3" && validOtp) {
        setTimeout(async () => {
          try {
            const nextOtpResponse = await fetch(
              `https://smshub.org/stubs/handler_api.php?api_key=${api_key_server}&action=setStatus&status=3&id=${id}`
            );
  
            if (!nextOtpResponse.ok) {
              throw new Error("Network response was not ok");
            }
  
            const nextOtpResponseData = await nextOtpResponse.text();
            console.log("nextotp:", nextOtpResponseData);
          } catch (nextOtpError) {
            
          }
        }, 1000); // Adjust the delay as needed
      }
  
      // Automatically trigger the next OTP URL for server 5
      if (server === "4" && validOtp) {
        setTimeout(async () => {
          try {
            const nextOtpResponse = await fetch(
              `https://api.grizzlysms.com/stubs/handler_api.php?api_key=${api_key_server}&action=setStatus&status=3&id=${id}`
            );
  
            if (!nextOtpResponse.ok) {
              throw new Error("Network response was not ok");
            }
  
            const nextOtpResponseData = await nextOtpResponse.text();
            console.log("nextotp:", nextOtpResponseData);
          } catch (nextOtpError) {
            
          }
        }, 1000); // Adjust the delay as needed
      }
  
      // Automatically trigger the next OTP URL for server 8
      if (server === "6" && validOtp) {
        setTimeout(async () => {
          try {
            const nextOtpResponse = await fetch(
              `https://api.sms-activate.guru/stubs/handler_api.php?api_key=${api_key_server}&action=setStatus&status=3&id=${id}`
            );
  
            if (!nextOtpResponse.ok) {
              throw new Error("Network response was not ok");
            }
  
            const nextOtpResponseData = await nextOtpResponse.text();
            console.log("nextotp:", nextOtpResponseData);
          } catch (nextOtpError) {
            
          }
        }, 1000); // Adjust the delay as needed
      }
      
      console.log("otp",validOtp)
      res.status(200).json({ otp: validOtp || "waiting" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      console.log(error);
    }
  };
  
 
  


  const cancelRequestQueue = [];
  const MAX_WORKER = 10000; // Number of concurrent workers
  let activeWorker = 0;
  
  // Enqueue a cancel request
  const enqueueCancelRequest = (requestHandler) => {
    cancelRequestQueue.push(requestHandler);
    processCancelQueue();
  };
  
  // Process the cancel queue using a worker pool
  const processCancelQueue = async () => {
    while (activeWorker < MAX_WORKER && cancelRequestQueue.length > 0) {
      const currentRequestHandler = cancelRequestQueue.shift();
      activeWorker++;
      currentRequestHandler()
        .then(() => {
          activeWorker--;
          processCancelQueue();
        })
        .catch((error) => {
          
          activeWorker--;
          processCancelQueue();
        });
    }
  };
  
  const numberCancel = (req, res) => {
    enqueueCancelRequest(() => handleNumberCancelRequest(req, res));
  };
  
  
  
  const handleNumberCancelRequest = async (req, res) => {
    try {
      const { Id, api_key  } = req.query;

      if (!Id || !api_key ) {
        return res
          .status(400)
          .json({ error: "bad key or id missing " });

      }

      const ipDetails = await getIpDetails(req);
      const admin = await Admin.findOne({});
      const apiAdminIp = admin?.adminIp;
      const isAdmin = req.clientIp === apiAdminIp;

      if(!isAdmin){
        const maintainanceServerData = await ServerData.findOne({ server: 0 });
        if (maintainanceServerData.maintenance) {
          return res.status(400).json({error:"Site is under maintenance."});
        }}
      
      const userapikey = await User.findOne({ apiKey:api_key });
      if (!userapikey) {
        return res.status(400).json({ error: "bad key or id missing" });
      }
      const transactions = await NumberHistory.findOne({ Id });
    console.log(transactions)
    if (!transactions) {
      return res.status(404).json({ error: "Transaction not found." });
    }

    if (transactions.status === "Cancelled") {
      return res.status(400).json({ status: "Number already cancelled" });
    }
      let apiUrl;
      let headers;
  
      const user = await User.findOne({ apiKey: api_key });
      if (!user) {
        return res.status(400).json({ error: "Invalid api key." });
      }
      
      const userData = await User.findById(user._id);

      
    

      if(!isAdmin){
      const maintainanceServerData = await ServerData.findOne({ server: 0 });
      if (maintainanceServerData.maintenance) {
        return res.status(403).json({ error: "Site is under maintenance." });
      }}
      const transaction = await NumberHistory.findOne({ Id: Id });
      const id=transaction.id
      console.log("id",id)
      
      const otpReceivedforId = transaction.otp; // Check if OTP exists in the transaction record
      console.log("otp status ", otpReceivedforId);
      
      // Skip the time difference check if OTP exists
      if (otpReceivedforId === null || otpReceivedforId === undefined) {
        const transactionTime = moment.tz(transaction.date_time, "DD/MM/YYYY HH:mm:ss A", "Asia/Kolkata");

        const currentTime = moment.tz("Asia/Kolkata");
        const timeDifference = currentTime.diff(transactionTime, 'minutes');
        
        if (timeDifference < 2) {
          return res.status(400).json({ message: "wait 2 minutes" });
        }
      }else if (otpReceivedforId) {
        await Order.deleteOne({ numberId: id });
        return res.status(200).json({ status: "Order Finished" });
      }
      const sname=transactions.serviceName
      const server=transaction.server
      const serviceData = await getServerData(sname, server);
      console.log(server)
      const serverData = await ServerData.findOne({ server });
  if(!isAdmin){
      if (serverData.maintenance) {
        return res
          .status(403)
          .json({ message: `Server ${server} is under maintenance.` });
      }}
  
      // Fetch user's transaction history to check for consecutive cancellations
      
  
    
      switch (server) {
        case "1":
          apiUrl = `https://fastsms.su/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&id=${id}&status=8`;
          break;
  
        case "2":
          apiUrl = `https://5sim.net/v1/user/cancel/${id}`;
          headers = {
            Authorization: `Bearer ${serverData.api_key}`,
            Accept: "application/json",
          };
          break;
  
        case "3":
          apiUrl = `https://smshub.org/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
       
  
        case "4":
          apiUrl = `https://api.grizzlysms.com/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
        case "5":
          apiUrl = `https://tempnum.org/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
        case "7":
          apiUrl = `https://smsbower.online/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
        case "6":
          apiUrl = `https://api.sms-activate.guru/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
        case "8":
          apiUrl = `https://phpfiles.paidsms.org/p/ccpay.php?type=cancel&number=${transaction.number}`;
          break;
        
        default:
          return res.status(400).json({ error: "Invalid server value." });
      }
  
      // Fetch data from the API URL
      const response = await fetch(apiUrl, { headers });
       
     
  
      const responseData = await response.text();
      
  
      if (!responseData || responseData.trim() === "") {
        throw new Error("Received empty response data.");
      }
  
      let existingEntry;
      let responseDataJson;
      let otpReceived = false;
  
      switch (server) {
        case "1":
          if (responseData.startsWith("STATUS_CANCEL")) {
            
              existingEntry = await NumberHistory.findOne({
                id,
              status: "CANCELLED",
              
              },
          );
          }
  
          else if (responseData.startsWith("ACCESS_APPROVED")) {
            otpReceived = true;
          }
  
          break;
  
          case "2":
            let responseDataJson;
            try {
              // Attempt to parse the response as JSON
              responseDataJson = JSON.parse(responseData);
          
              if (responseDataJson.status === "CANCELED") {
                existingEntry = await NumberHistory.findOne({
                  id,
                  status: "CANCELLED",
                });
              }
            } catch (error) {
              // Handle cases where the response is not valid JSON
              if (responseData === "order has sms") {
                otpReceived = true;
              } else {
               
                // Handle or log other unexpected responses
              }
            }
            break;
        case "3":
          if (responseData.startsWith("ACCESS_CANCEL")) {
            existingEntry = await NumberHistory.findOne({
              id,
            status: "CANCELLED",
            
            },
            );}
           else if (responseData.startsWith("ACCESS_ACTIVATION") ){
              otpReceived = true;
            }
            break;
          
  
        
  
        case "4":
          if (
            responseData.startsWith("ACCESS_CANCEL")
          ) {
            existingEntry = await NumberHistory.findOne({
              id,
            status: "CANCELLED",
            
            },
            );}
            else if (responseData.startsWith("BAD_ACTION") ){
              otpReceived = true;
            }
          break;
  
        case "5":
          if (
            responseData.startsWith("ACCESS_CANCEL")
          ) {
            existingEntry = await NumberHistory.findOne({
              id,
            status: "CANCELLED",
            
            },
            );}
           else if (responseData.startsWith("NO_ACTIVATION") ){
              otpReceived = true;
            }
          break;
  
        case "7":
          if (
            responseData.startsWith("ACCESS_CANCEL")
          ) {
            existingEntry = await NumberHistory.findOne({
              id,
            status: "CANCELLED",
            
            },
          )}
         else if (responseData.startsWith("BAD_STATUS") ){
            otpReceived = true;
          }
          break;
  
        case "6":
          if (
            responseData.startsWith("ACCESS_CANCEL")
          ) {
            existingEntry = await NumberHistory.findOne({
              id,
            status: "CANCELLED",
            
            },
          );}
         else if (responseData.startsWith("BAD_STATUS") ){
            otpReceived = true;
          }
          break;
  
        case "8":
          if (responseData.startsWith("success")) {
            existingEntry = await NumberHistory.findOne({
              id,
            status: "CANCELLED",
            
            },
          );} else if (!responseData.startsWith("success") ){
            console.log("otp received in response")
            otpReceived = true;
          }
          break;
       
        default:
          return res.status(400).json({ error: "Invalid server value." });
      }
      console.log("responseData",responseData)
      if (otpReceived) {
        await Order.deleteOne({ numberId: id });
        return res.status(200).json({ status: "Order Finished" });
      }
  
      // Fetch IP details using the getIpDetails function
      
      const { city, state, pincode, country, serviceProvider, ip } = ipDetails;
  
      const ipDetailsString = `\nCity: ${city}\nState: ${state}\nPincode: ${pincode}\nCountry: ${country}\nService Provider: ${serviceProvider}\nIP: ${ip}`;
  
      if (!existingEntry) {
        const formattedDateTime = moment().tz("Asia/Kolkata").format("DD/MM/YYYY HH:mm A");
  
        const transaction = await NumberHistory.findOne({ id });
  
         // Update the existing entry instead of creating a new one
  const updatedEntry = await NumberHistory.updateOne(
    { id }, // Find the existing entry by id
    {
      $set: {
        otp: null, // Set OTP to null
        status: "Cancelled", // Update status to "Cancelled"
        reason: "SMS not Received", // Update reason
        date_time: formattedDateTime, // Update the date and time
      },
    }
  );
        
        if (!transaction.otp) {
          const incrementAmount = parseFloat(transaction.price.toFixed(2));
          
          // Increment balance in the database
          await User.updateOne(
            { _id: user._id },
            { $inc: { balance: incrementAmount } }
          );
        
        }
        const balance=await User.findOne( { _id: user._id });
        console.log("service data code from cancel",serviceData.code)
        console.log("balance after cancel", balance.balance)
        await numberCancelDetails({
          email: userData.email,
          serviceName: transaction.serviceName,
          code: serviceData.code,
          price: transaction.price,
          server,
          number: transaction.number,
          balance: balance.balance.toFixed(2),
          ip: ipDetailsString,
        });
  
        await Order.deleteOne({ numberId: id });
      }
      
        res.status(200).json({ status: "Number Cancelled", });
  
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      console.log(error);
    }
  };
  
  const cancelRequestQueue1 = [];
  const MAX_WORKER1 = 10000; // Number of concurrent workers
  let activeWorker1 = 0;
  
  // Enqueue a cancel request
  const enqueueCancelRequest1 = (requestHandler) => {
    cancelRequestQueue1.push(requestHandler);
    processCancelQueue1();
  };
  
  // Process the cancel queue using a worker pool
  const processCancelQueue1 = async () => {
    while (activeWorker1 < MAX_WORKER1 && cancelRequestQueue1.length > 0) {
      const currentRequestHandler = cancelRequestQueue1.shift();
      activeWorker1++;
      currentRequestHandler()
        .then(() => {
          activeWorker1--;
          processCancelQueue1();
        })
        .catch((error) => {
          
          activeWorker1--;
          processCancelQueue1();
        });
    }
  };
  
  const numberCancel1 = (req, res) => {
    enqueueCancelRequest1(() => handleNumberCancel(req, res));
  };
  const handleNumberCancel = async (req, res) => {
    try {
      const { Id, api_key  } = req.query;

      if (!Id || !api_key ) {
        return res
          .status(400)
          .json({ error: "bad key or id missing " });


      }


      const ipDetails = await getIpDetails(req);
      const admin = await Admin.findOne({});
      const apiAdminIp = admin?.adminIp;
      const isAdmin = req.clientIp === apiAdminIp;

      if(!isAdmin){
        const maintainanceServerData = await ServerData.findOne({ server: 0 });
        if (maintainanceServerData.maintenance) {
          return res.status(400).json({error:"Site is under maintenance."});
        }}

      const userapikey = await User.findOne({ apiKey:api_key });
      if (!userapikey) {
        return res.status(400).json({ error: "bad key or id missing" });
      }
  
      const transactions = await NumberHistory.findOne({ Id });
    console.log(transactions)
    if (!transactions) {
      return res.status(404).json({ error: "Transaction not found." });
    }

    if (transactions.status === "Cancelled") {
      return res.status(400).json({ status: "Number already cancelled" });
    }
      let apiUrl;
      let headers;
  
      const user = await User.findOne({ apiKey: api_key });
      if (!user) {
        return res.status(400).json({ error: "Invalid api key." });
      }
      
      const userData = await User.findById(user._id);
      
      if(!isAdmin){
        const maintainanceServerData = await ServerData.findOne({ server: 0 });
        if (maintainanceServerData.maintenance) {
          return res.status(403).json({ error: "Site is under maintenance." });
        }}
      const transaction = await NumberHistory.findOne({ Id: Id });
      const id=transaction.id
      console.log("id",id)
      
      
      
      const sname=transactions.serviceName
    
   
      
      const server=transaction.server
      const serviceData = await getServerData(sname, server);
      console.log(server)
      const serverData = await ServerData.findOne({ server });
  
      if(!isAdmin){
        if (serverData.maintenance) {
          return res
            .status(403)
            .json({ message: `Server ${server} is under maintenance.` });
        }}
  
      // Fetch user's transaction history to check for consecutive cancellations
      
  
    
      switch (server) {
        case "1":
          apiUrl = `https://fastsms.su/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&id=${id}&status=8`;
          break;
  
        case "2":
          apiUrl = `https://5sim.net/v1/user/cancel/${id}`;
          headers = {
            Authorization: `Bearer ${serverData.api_key}`,
            Accept: "application/json",
          };
          break;
  
        case "3":
          apiUrl = `https://smshub.org/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
       
  
        case "4":
          apiUrl = `https://api.grizzlysms.com/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
        case "5":
          apiUrl = `https://tempnum.org/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
        case "7":
          apiUrl = `https://smsbower.online/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
        case "6":
          apiUrl = `https://api.sms-activate.guru/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
        case "8":
          apiUrl = `https://phpfiles.paidsms.org/p/ccpay.php?type=cancel&number=${data.number}`;
          break;
        
        default:
          return res.status(400).json({ error: "Invalid server value." });
      }
  
      // Fetch data from the API URL
      const response = await fetch(apiUrl, { headers });
       
     
  
      const responseData = await response.text();
  
      if (!responseData || responseData.trim() === "") {
        throw new Error("Received empty response data.");
      }
  
      let existingEntry;
      let responseDataJson;
      let otpReceived = false;
  
      switch (server) {
        case "1":
          if (responseData.startsWith("STATUS_CANCEL")) {
            
              existingEntry = await NumberHistory.findOne({
                id,
              status: "CANCELLED",
              
              },
          );
          }
  
          else if (responseData.startsWith("ACCESS_APPROVED")) {
            otpReceived = true;
          }
  
          break;
  
          case "2":
            let responseDataJson;
            try {
              // Attempt to parse the response as JSON
              responseDataJson = JSON.parse(responseData);
          
              if (responseDataJson.status === "CANCELED") {
                existingEntry = await NumberHistory.findOne({
                  id,
                  status: "CANCELLED",
                });
              }
            } catch (error) {
              // Handle cases where the response is not valid JSON
              if (responseData === "order has sms") {
                otpReceived = true;
              } else {
                
                // Handle or log other unexpected responses
              }
            }
            break;
        case "3":
          if (responseData.startsWith("ACCESS_CANCEL")) {
            existingEntry = await NumberHistory.findOne({
              id,
            status: "CANCELLED",
            
            },
            );}
           else if (responseData.startsWith("ACCESS_ACTIVATION") ){
              otpReceived = true;
            }
            break;
          
  
        
  
        case "4":
          if (
            responseData.startsWith("ACCESS_CANCEL")
          ) {
            existingEntry = await NumberHistory.findOne({
              id,
            status: "CANCELLED",
            
            },
            );}
            else if (responseData.startsWith("BAD_ACTION") ){
              otpReceived = true;
            }
          break;
  
        case "5":
          if (
            responseData.startsWith("ACCESS_CANCEL")
          ) {
            existingEntry = await NumberHistory.findOne({
              id,
            status: "CANCELLED",
            
            },
            );}
           else if (responseData.startsWith("NO_ACTIVATION") ){
              otpReceived = true;
            }
          break;
  
        case "7":
          if (
            responseData.startsWith("ACCESS_CANCEL")
          ) {
            existingEntry = await NumberHistory.findOne({
              id,
            status: "CANCELLED",
            
            },
          )}
         else if (responseData.startsWith("BAD_STATUS") ){
            otpReceived = true;
          }
          break;
  
        case "6":
          if (
            responseData.startsWith("ACCESS_CANCEL")
          ) {
            existingEntry = await NumberHistory.findOne({
              id,
            status: "CANCELLED",
            
            },
          );}
         else if (responseData.startsWith("BAD_STATUS") ){
            otpReceived = true;
          }
          break;
  
        case "8":
          if (responseData.startsWith("success")) {
            existingEntry = await NumberHistory.findOne({
              id,
            status: "CANCELLED",
            
            },
          );} else if (!responseData.startsWith("success") ){
            otpReceived = true;
          }
          break;
       
        default:
          return res.status(400).json({ error: "Invalid server value." });
      }
  
      if (otpReceived) {
        await Order.deleteOne({ numberId: id });
        return res.status(200).json({ status: "Order Finished" });
      }
  
      // Fetch IP details using the getIpDetails function
      
      const { city, state, pincode, country, serviceProvider, ip } = ipDetails;
  
      const ipDetailsString = `\nCity: ${city}\nState: ${state}\nPincode: ${pincode}\nCountry: ${country}\nService Provider: ${serviceProvider}\nIP: ${ip}`;
  
      if (!existingEntry) {
        const formattedDateTime = moment().tz("Asia/Kolkata").format("DD/MM/YYYY HH:mm A");
  
        const transaction = await NumberHistory.findOne({ id });
  
         // Update the existing entry instead of creating a new one
  const updatedEntry = await NumberHistory.updateOne(
    { id }, // Find the existing entry by id
    {
      $set: {
        otp: null, // Set OTP to null
        status: "Cancelled", // Update status to "Cancelled"
        reason: "SMS not Received", // Update reason
        date_time: formattedDateTime, // Update the date and time
      },
    }
  );
        
        if (!transaction.otp) {
          const incrementAmount = parseFloat(transaction.price.toFixed(2));
          
          // Increment balance in the database
          await User.updateOne(
            { _id: user._id },
            { $inc: { balance: incrementAmount } }
          );
        
        }
        const balance=await User.findOne( { _id: user._id });
        await numberCancelDetails({
          email: userData.email,
          serviceName: transaction.serviceName,
          code: serviceData.code,
          price: transaction.price,
          server,
          number: transaction.number,
          balance: balance.balance.toFixed(2),
          ip: ipDetailsString,
        });
  
        await Order.deleteOne({ numberId: id });
      }
      
        res.status(200).json({ status: "Number Cancelled", });
  
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      console.log(error);
    }
  };
  
  export {
    getNumber,
    getOtp,
  numberCancel,
  checkAndCancelExpiredOrders,
  numberCancel1,
  checkServiceAvailability,
  
   
  };
  