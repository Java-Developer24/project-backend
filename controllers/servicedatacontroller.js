import moment from "moment";
import Service from '../models/service.js';
import { NumberHistory } from "./../models/history.js";
import User from "../models/user.js";
import { userDiscountModel } from '../models/userDiscount.js'
;import { getIpDetails } from "../utils/getIpDetails.js";
import { Order } from "./../models/order.js";
import fetch from "node-fetch";
import ServerData from "../models/serverData.js";
import { userBlockDetails } from "../utils/telegram-userblock.js";
import {BlockModel} from "../models/block.js"
import {

    numberGetDetails,
    otpGetDetails,
    numberCancelDetails
   
  } from "../utils/telegram-service.js";


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
  
  const requestQueue = [];
  let isProcessing = false;
  
  const enqueueRequest = (requestHandler) => {
    requestQueue.push(requestHandler);
    processQueue();
  };
  
  const processQueue = async () => {
    if (isProcessing || requestQueue.length === 0) return;
  
    isProcessing = true;
    const currentRequestHandler = requestQueue.shift();
    await currentRequestHandler();
    isProcessing = false;
  
    if (requestQueue.length > 0) {
      processQueue();
    }
  };
  
  // Helper function to get API key and check maintenance
  const getServerMaintenanceData = async (server) => {
    // Check if the server is under maintenance
    const maintainanceServerData = await ServerData.findOne({ server: 0 });
    if (maintainanceServerData.maintainance) {
      throw new Error("Site is under maintenance.");
    }
  
    const serverData = await ServerData.findOne({ server });
    if (!serverData) {
      throw new Error("Server data not found.");
    }
  
    if (serverData.maintainance) {
      throw new Error(`Server ${server} is under maintenance.`);
    }
  
    return serverData;
  };
  
  // Helper function to construct API URL
  const constructApiUrl = (server, api_key_server, data,otpType) => {
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
        return `https://api.tiger-sms.com/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&country=22`;
  
      case "5":
        return `https://api.grizzlysms.com/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&country=22`;
  
      case "6":
        return `https://tempnum.org/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&country=22`;
  
        case "7":
          return `  https://smsbower.online/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&country=22&maxPrice=${data.price} `;
         
        case "8":
          return `https://api.sms-activate.guru/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&operator=any&country=22&maxPrice=${data.price}`;
  
      case "9":
        return `http://www.phantomunion.com:10023/pickCode-api/push/buyCandy?token=${api_key_server}&businessCode=${data.code}&quantity=1&country=IN&effectiveTime=10`;
      case "10":
          return `https://sms-activation-service.pro/stubs/handler_api?api_key=${api_key_server}&action=getNumber&service=${data.code}&operator=any&country=22`;
      case "11":
      return `https://api.sms-man.com/control/get-number?token=${api_key_server}&application_id=${data.code}&country_id=14&hasMultipleSms=${
    otpType === "Multiple Otp" ? "true" : "false"}`;
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
  
        case "6":
          const response6parts = responseData.split(":");
  
          return {
            id: response6parts[1],
            number: response6parts[2].substring(2),
          };
  
        case "7":
          const response7Data = JSON.parse(responseData);
          return {
            id: response7Data.request_id,
            number: response7Data.number.replace(/^91/, ""),
          };
  
        case "8":
          const response8Data = JSON.parse(responseData);
          return {
            id: response8Data.request_id,
            number: response8Data.number.replace(/^91/, ""),
          };
  
        case "9":
          const responseDataJson = JSON.parse(responseData);
  
          const phoneData = responseDataJson.data.phoneNumber[0];
          return {
            id: phoneData.serialNumber,
            number: phoneData.number.replace("+91", ""),
          };
          case "10": // Server 10 response: ACCESS_NUMBER:14696852:917709772308
          const parts10 = responseData.split(":");
          return {
            id: parts10[1],
            number: parts[2].substring(2),
          };
  
          case "11": // Server 11 response: {"request_id":588947233,"application_id":1491,"country_id":14,"number":"919125831873"}
          const response11Data = JSON.parse(responseData);
          const fullNumber = response11Data.number;
          const trimmedNumber = fullNumber.startsWith("91") ? fullNumber.substring(2) : fullNumber;
          return {
            id: response11Data.request_id,
            number: trimmedNumber,
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
  
    // User-specific discount
    const userDiscount = await userDiscountModel.findOne({
      userId,
      service: sname,
      server,
    });
    if (userDiscount) {
      totalDiscount += parseFloat(userDiscount.discount.toFixed(2));
    }
  
    // Service discount (retrieve the service with its servers and find the specific server's discount)
    const serviceDiscount = await Service.findOne({
      service: sname,
      server,
    });
    if (serviceDiscount) {
      totalDiscount += parseFloat(serviceDiscount.discount.toFixed(2));
    }
  
    // Server discount
    const serverDiscount = await Service.findOne({ server });
    if (serverDiscount) {
      totalDiscount += parseFloat(serverDiscount.discount.toFixed(2));
    }
  
    // Ensure the final totalDiscount is also in the correct format
    return parseFloat(totalDiscount.toFixed(2));
  };
  
  const getNumber = (req, res) => {
    enqueueRequest(() => handleGetNumberRequest(req, res));
  };
  
  const handleGetNumberRequest = async (req, res) => {
    try {
      const { servicecode, api_key, server,otpType } = req.query;
  
      if (!servicecode || !api_key || !server) {
        return res
          .status(400)
          .json({ error: "Service code, API key, and Server are required." });
      }
  
      const ipDetails = await getIpDetails(req);
  
      const serverCode = await Service.findOne({name: servicecode });
      if (!serverCode) {
        throw new Error("Service not found.");
      }
  
      const sname = serverCode.name;
  
      const user = await User.findOne({apiKey: api_key });
      if (!user) {
        return res.status(400).json({ error: "Invalid API key." });
      }
  
      const userData = await User.findById({ _id: user._id });
      if (userData.blocked) {
        return res
          .status(400)
          .json({ error: "Your account is blocked, contact the Admin." });
      }
  
      const serverData = await getServerMaintenanceData(server);
      const api_key_server = serverData.api_key;
  
      const serviceData = await getServerData(sname, server);
      let price = parseFloat(serviceData.price);
  
      if (user.balance < price) {
        return res.status(400).json({ error: "Insufficient balance." });
      }
  
      const apiUrl = constructApiUrl(server, api_key_server, serviceData,otpType);
  
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
          console.error(error);
          if (attempt === 1) {
            return res.status(400).json({
              error: "No numbers available. Please try different server.",
            });
          }
        }
      }
  
      const totalDiscount = await calculateDiscounts(user.userId, sname, server);
      price = parseFloat((price - totalDiscount).toFixed(2));
  
      user.balance -= price;
      user.balance = parseFloat(user.balance.toFixed(2));
      await user.save();
  
      const formattedDateTime = moment().format("DD/MM/YYYYTHH:mm A");


  
      const numberHistory = new NumberHistory({
        userId: user._id,
        serviceName: sname,
        price,
        server,
        id,
        otps: null,
        status: "Success",
        reason:"Waiting for SMS",
        number,
        date_time: formattedDateTime,
      });
      await numberHistory.save();
  
      const { city, state, pincode, country, serviceProvider, ip } = ipDetails;
      const ipDetailsString = `\nCity: ${city}\nState: ${state}\nPincode: ${pincode}\nCountry: ${country}\nService Provider: ${serviceProvider}\nIP: ${ip}`;
  
      await numberGetDetails({
        email: user.email,
        serviceName: sname,
        serviceCode: serviceData.code,
        price,
        server,
        number,
        balance: user.balance,
        ip: ipDetailsString,
      });
  
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 20);
  
      const newOrder = new Order({
        userId: user._id,
        service: sname,
        price,
        server,
        otpType,
        numberId: id,
        number,
        orderTime: new Date(),
        expirationTime,
      });
      await newOrder.save();
  
      res.status(200).json({ number, id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  };
  

  const TIME_OFFSET = 60000; // 1 minute in milliseconds

const checkAndCancelExpiredOrders = async () => {
  try {
    const currentTime = new Date();
    const expiredOrders = await Order.find({
      expirationTime: { $lte: new Date(currentTime.getTime() + TIME_OFFSET) },
    });

    for (const order of expiredOrders) {
      const timeDifference =
        new Date(order.expirationTime).getTime() - currentTime.getTime() - TIME_OFFSET;

      if (timeDifference >= 0) {
        // Schedule cancellation if within future range
        setTimeout(() => cancelOrder(order), timeDifference);
      } else {
        // Immediately cancel already expired orders
        await cancelOrder(order);
      }
    }
  } catch (error) {
    console.error("Error in checkAndCancelExpiredOrders:", error.message);
  }
};

export const cancelOrder = async (order) => {
  try {
    const user = await User.findOne({ _id: order.userId });

    if (user && user.apiKey) {
      await callNumberCancelAPI(user.apiKey, order.numberId, order.server);
    } else {
      console.error(`No API key found for user ${order.userId}`);
    }
  } catch (error) {
    console.error(`Error cancelling order ${order._id}:`, error.message);
  }
};

const callNumberCancelAPI = async (apiKey, numberId, server) => {
  try {
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/service/number-cancel?api_key=${apiKey}&id=${numberId}&server=${server}`
    );

    if (!response.ok) {
      const errorResponse = await response.json();
      console.error(`API call failed:`, errorResponse);
    }
  } catch (error) {
    console.error("Error in callNumberCancelAPI:", error.message);
  }
};

  
 





  const getOtp = async (req, res) => {
    try {
      const { id, api_key, server,otpType } = req.query;
      console.log(id)
      console.log(server)
  
      if (!id) {
        return res.status(400).json({ error: "ID is required." });
      }
      if (!server) {
        return res.status(400).json({ error: "Server is required." });
      }
      if (!api_key) {
        return res.status(400).json({ error: "Api key is required." });
      }
  
      let apiUrl;
      let headers;
  
      const user = await User.findOne({ apiKey:api_key });
      if (!user) {
        return res.status(400).json({ error: "Invalid api key." });
      }
  
      const userData = await User.findById({ _id: user._id });
  
      // Check server maintenance and get API key
      const serverData = await getServerMaintenanceData(server);
      const api_key_server = serverData.api_key; // Fetch API key from ServerModel
      console.log(api_key_server)
  
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
          apiUrl = `https://api.tiger-sms.com/stubs/handler_api.php?api_key=${api_key_server}&action=getStatus&id=${id}`;
          break;
  
        case "5":
          apiUrl = `https://api.grizzlysms.com/stubs/handler_api.php?api_key=${api_key_server}&action=getStatus&id=${id}`;
          break;
  
        case "6":
          apiUrl = `https://tempnum.org/stubs/handler_api.php?api_key=${api_key_server}&action=getStatus&id=${id}`;
          break;
  
        case "7":
          apiUrl = `https://smsbower.online/stubs/handler_api.php?api_key=${api_key_server}&action=getStatus&id=${id}`;
          break;
  
        case "8":
          apiUrl = `https://api.sms-activate.guru/stubs/handler_api.php?api_key=${api_key_server}&action=getStatus&id=${id}`;
          break;
  
        case "9":
          apiUrl = `http://www.phantomunion.com:10023/pickCode-api/push/sweetWrapper?token=${api_key_server}&serialNumber=${id}`;
          break;
        case "10":
            apiUrl=`https://sms-activation-service.pro/stubs/handler_api?api_key=${api_key_server}&action=getStatus&id=${id} `
            break;
        case "11":
          apiUrl=`https://api.sms-man.com/control/get-sms?token=${api_key_server}&request_id=${id}`
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
  
      if (!responseData || responseData.trim() === "") {
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
            try {
              // Parse the response data as JSON
              const responseDataJson = JSON.parse(responseData);
          
              // Initialize validOtp as an array to store all OTPs
              validOtp = [];
          
              // Check if the "sms" array exists and contains messages
              if (responseDataJson.sms && responseDataJson.sms.length > 0) {
                // Sort SMS messages by the most recent date (descending order)
                const sortedSms = responseDataJson.sms.sort(
                  (a, b) => new Date(b.date) - new Date(a.date)
                );
          
                // Extract OTPs from all messages and store them in the validOtp array
                validOtp = sortedSms
                  .map((sms) => {
                    const otpMatch = sms.text.match(/\b\d{4,6}\b/); // Match 4-6 digit numbers
                    return otpMatch ? otpMatch[0] : null; // Return OTP if found, otherwise null
                  })
                  .filter((otp) => otp !== null); // Remove any null values
              } else {
                // No OTP available in the "sms" array
                console.log("No OTP received in the response.");
                validOtp = []; // Empty array if no OTPs
              }
            } catch (error) {
              console.error("Error processing case 2 response:", error.message);
              throw new Error("Failed to process the OTP response for case 2.");
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
          // Check if the response data includes "OK" followed by the OTP
          if (responseData.startsWith("STATUS_OK")) {
            // Split the response data to extract the OTP
            const parts = responseData.split(":");
            const otp = parts[1]; // Trim to remove any leading or trailing spaces
  
            validOtp = otp;
          }
          break;
  
          case "6":
            try {
              // Check if the response data starts with "STATUS_OK"
              if (responseData.startsWith("STATUS_OK")) {
                // Split the response data to extract the part after "STATUS_OK:"
                const parts = responseData.split(":");
                const messageText = parts[1]?.trim(); // Trim to remove any leading or trailing spaces
          
                // Use a regular expression to extract the OTP (4-6 digit number)
                const otpMatch = messageText.match(/\b\d{4,6}\b/); // Match 4-6 digit numbers
          
                if (otpMatch) {
                  validOtp = otpMatch[0]; // Store the extracted OTP
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
              console.error("Error processing case 6 response:", error.message);
              throw new Error("Failed to process the OTP response for case 6.");
            }
            break;
          
  
        case "7":
          const response7Data = JSON.parse(responseData);
          if (response7Data.sms_code) {
            validOtp = response7Data.sms_code;
          }
          break;
  
        case "8":
          const response8Data = JSON.parse(responseData);
          if (response8Data.sms_code) {
            validOtp = response8Data.sms_code;
          }
          break;
  
          case "9":
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
                  // Use a regular expression to extract the OTP (4-6 digit number)
                  const otpMatch = vcText.match(/\b\d{4,6}\b/); // Match 4-6 digit numbers
          
                  if (otpMatch) {
                    validOtp = otpMatch[0]; // Store the extracted OTP
                  } else {
                    console.log("No OTP found in the vc field.");
                    validOtp = null; // No OTP found in `vc`
                  }
                } else {
                  console.log("vc field is empty or undefined.");
                  validOtp = null; // No `vc` provided
                }
              } else {
                console.log("Verification code data is missing or empty.");
                validOtp = null; // No verification code data
              }
            } catch (error) {
              console.error("Error processing case 9 response:", error.message);
              throw new Error("Failed to process the OTP response for case 9.");
            }
            break;
          
          case "10":
            // Check if the response data includes "OK" followed by the OTP
          if (responseData.startsWith("STATUS_OK")) {
            // Split the response data to extract the part after "STATUS_OK:"
            const parts = responseData.split(":");
            const otp = parts[1].trim(); // Trim to remove any leading or trailing spaces
  
            validOtp = otp;
          }
          break;
          case "11":
            try {
              // Parse the response data as JSON
              const parsedData = JSON.parse(responseData);
          
              // Check if `sms_code` is present, indicating the OTP has been received
                      if (parsedData.sms_code) {
                validOtp = parsedData.sms_code; // Store the OTP in `validOtp`
              } else if (
                parsedData.error_code === "wait_sms" &&
                parsedData.error_msg === "Still waiting..."
              ) {
                console.log("Waiting for OTP..."); // Optional log to indicate waiting
                validOtp = null; // No OTP available yet
              } else {
                throw new Error("Unexpected response format or missing fields.");
              }
            } catch (error) {
              console.error("Error processing case 11 response:", error.message);
              throw new Error("Failed to process OTP response.");
            }
              break;

  
        default:
          return res.status(400).json({ error: "Invalid server value." });
      }
      console.log("otp",validOtp)
      if (validOtp) {
        const existingEntry = await NumberHistory.findOneAndUpdate({
          id},{
          otp: [validOtp],
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
          const formattedDateTime = moment().format("MM/DD/YYYYTHH:mm:ss A");
      
          // Update the OTP entry format to include "message" as an object, not a string
          const otpEntry = {
            message: validOtp, // Valid OTP message here
            
          };
      
          // Create and save the new entry
          const numberHistory = new NumberHistory({
            userId: user._id,
            serviceName: transaction.serviceName,
            price: transaction.price,
            server,
            id,
            otps: [otpEntry],  // Ensure this is an array of objects, not just a string
            status: "Success",
            reason:"SMS Received",
            number: transaction.number,
            date_time: formattedDateTime,
          });
      
          await numberHistory.save();
          console.log("Saved OTP Entry:", numberHistory);
          // Fetch IP details using the getIpDetails function
        const ipDetails = await getIpDetails(req);
        // Destructure IP details
        const { city, state, pincode, country, serviceProvider, ip } =
          ipDetails;

        // Pass the destructured IP details to the numberGetDetails function as a multiline string
        const ipDetailsString = `\nCity: ${city}\nState: ${state}\nPincode: ${pincode}\nCountry: ${country}\nService Provider: ${serviceProvider}\nIP: ${ip}`;

        await otpGetDetails({
          email: userData.email,
          serviceName: transaction.service,
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
            console.error("Error fetching next OTP:", nextOtpError.message);
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
            console.error("Error fetching next OTP:", nextOtpError.message);
          }
        }, 1000); // Adjust the delay as needed
      }
  
      // Automatically trigger the next OTP URL for server 5
      if (server === "5" && validOtp) {
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
            console.error("Error fetching next OTP:", nextOtpError.message);
          }
        }, 1000); // Adjust the delay as needed
      }
  
      // Automatically trigger the next OTP URL for server 8
      if (server === "8" && validOtp) {
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
            console.error("Error fetching next OTP:", nextOtpError.message);
          }
        }, 1000); // Adjust the delay as needed
      }
      if (server === "11" && validOtp) {
        setTimeout(async () => {
          try {
            const nextOtpResponse = await fetch(
              `https://api2.sms-man.com/control/set-status?token=${api_key_server}&request_id=${id}&status=retrysms`
            );
  
            if (!nextOtpResponse.ok) {
              throw new Error("Network response was not ok");
            }
  
            const nextOtpResponseData = await nextOtpResponse.text();
            console.log("nextotp:", nextOtpResponseData);
          } catch (nextOtpError) {
            console.error("Error fetching next OTP:", nextOtpError.message);
          }
        }, 1000); // Adjust the delay as needed
      }
      console.log("otp",validOtp)
      res.status(200).json({ otp: validOtp || "" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      console.log(error);
    }
  };
  
  const isWithinTime = (date_time) => {
    // Get the current moment
    const now = moment();
  
    // Define the moment value to check
    const dateTimeValue = moment(date_time, "DD/MM/YYYYTHH:mm A");
  
    // Calculate the difference in minutes between the two moments
    const differenceInMinutes = now.diff(dateTimeValue, "minutes");
  
    // Check if the difference is less than or equal to 3 minutes
    return Math.abs(differenceInMinutes) <= 3;
  };
  



  const cancelRequestQueue = [];
  let isCancelProcessing = false;
  
  const enqueueCancelRequest = (requestHandler) => {
    cancelRequestQueue.push(requestHandler);
    processCancelQueue();
  };
  
  const processCancelQueue = async () => {
    if (isCancelProcessing || cancelRequestQueue.length === 0) return;
  
    isCancelProcessing = true;
    const currentRequestHandler = cancelRequestQueue.shift();
    await currentRequestHandler();
    isCancelProcessing = false;
  
    if (cancelRequestQueue.length > 0) {
      processCancelQueue();
    }
  };
  
  const numberCancel = (req, res) => {
    enqueueCancelRequest(() => handleNumberCancelRequest(req, res));
  };
  
  const handleNumberCancelRequest = async (req, res) => {
    try {
      const { id, api_key, server } = req.query;
  
      if (!id) {
        return res.status(400).json({ error: "ID is required." });
      }
      if (!server) {
        return res.status(400).json({ error: "Server is required." });
      }
      if (!api_key) {
        return res.status(400).json({ error: "Api key is required." });
      }
  
      let apiUrl;
      let headers;
  
      const user = await User.findOne({ apiKey: api_key });
      if (!user) {
        return res.status(400).json({ error: "Invalid api key." });
      }
  
      const userData = await User.findById(user._id);
  
      const maintainanceServerData = await ServerData.findOne({ server: 0 });
      if (maintainanceServerData.maintainance) {
        return res.status(403).json({ error: "Site is under maintenance." });
      }
  
      const serverData = await ServerData.findOne({ server });
  
      if (serverData.maintainance) {
        return res
          .status(403)
          .json({ message: `Server ${server} is under maintenance.` });
      }
  
      // Fetch user's transaction history to check for consecutive cancellations
      let userTransactions = await NumberHistory.find({
        userId: user._id,
      });
  
      // Find the transaction with the matching ID
      const data = userTransactions.filter((t) => t.id === id);
  
      if (data.some((t) => t.otps)) {
        await Order.deleteOne({ numberId: id });
        return res.status(200).json({ access: "Otp Received" });
      }
  
      if (data.some((t) => t.status === "Cancelled")) {
        return res.status(200).json({ access: "Number Cancelled" });
      }
  
      userTransactions = userTransactions
        .filter((u) => u.status === "Cancelled")
        .reverse();
  
      let thirdLastTransactions = null;
  
      if (userTransactions.length >= 3) {
        thirdLastTransactions = userTransactions[2];
      }
  
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
          apiUrl = `https://api.tiger-sms.com/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
        case "5":
          apiUrl = `https://api.grizzlysms.com/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
        case "6":
          apiUrl = `https://tempnum.org/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
        case "7":
          apiUrl = `https://smsbower.online/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
        case "8":
          apiUrl = `https://api.sms-activate.guru/stubs/handler_api.php?api_key=${serverData.api_key}&action=setStatus&status=8&id=${id}`;
          break;
  
        case "9":
          apiUrl = `https://own5k.in/p/ccpay.php?type=cancel&number=${data.number}`;
          break;
        case "10":
          apiUrl = `https://sms-activation-service.pro/stubs/handler_api?api_key=${serverData.api_key}&action=setStatus&id=${id}&status=8 `;
          break;
        case "11":
          apiUrl = `https://api2.sms-man.com/control/set-status?token=${serverData.api_key}&request_id=${id}&status=reject`;
          break;
        default:
          return res.status(400).json({ error: "Invalid server value." });
      }
  
      // Fetch data from the API URL
      const response = await fetch(apiUrl, { headers });
  
      if (!response.ok) {
        return res.status(400).json({ error: "Error Occured" });
      }
  
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
            existingEntry = await NumberHistory.findOneAndUpdate(
              {id},
              {
                otps: null,
              status: "Cancelled",
              reason: "SMS not Received"
            },
            { new: true }  // Return the updated document
          );
          }
  
          if (responseData.startsWith("ACCESS_APPROVED")) {
            otpReceived = true;
          }
  
          break;
  
        case "2":
          responseDataJson = JSON.parse(responseData);
          if (responseDataJson.status === "CANCELED") {
            existingEntry = await NumberHistory.findOneAndUpdate(
              {id},
              {
                otps: null,
              status: "Cancelled",
              reason: "SMS not Received"
            },
            { new: true }  // Return the updated document);
            );}
          if (responseDataJson.status === "order has sms") {
            otpReceived = true;
          }
          break;
  
        case "3":
          if (responseData.startsWith("ACCESS_CANCEL")) {
            existingEntry = await NumberHistory.findOneAndUpdate(
              {id},
              {
                otps: null,
              status: "Cancelled",
              reason: "SMS not Received"
            },
            { new: true }  // Return the updated document);
            );}
          break;
  
        case "4":
          if (
            responseData.startsWith("ACCESS_CANCEL") ||
            responseData.startsWith("BAD_STATUS")
          ) {
            existingEntry = await NumberHistory.findOneAndUpdate(
              {id},
              {
                otps: null,
              status: "Cancelled",
              reason: "SMS not Received"
            },
            { new: true }  // Return the updated document);
            );}
          break;
  
        case "5":
          if (
            responseData.startsWith("ACCESS_CANCEL") ||
            responseData.startsWith("BAD_ACTION")
          ) {
            existingEntry = await NumberHistory.findOneAndUpdate(
              {id},
              {
                otps: null,
              status: "Cancelled",
              reason: "SMS not Received"
            },
            { new: true }  // Return the updated document);
            );}
          break;
  
        case "6":
          if (
            responseData.startsWith("ACCESS_CANCEL") ||
            responseData.startsWith("NO_ACTIVATION")
          ) {
            existingEntry = await NumberHistory.findOneAndUpdate(
              {id},
              {
                otps: null,
              status: "Cancelled",
              reason: "SMS not Received"
            },
            { new: true }  // Return the updated document);
            );}
          break;
  
        case "7":
          responseDataJson = JSON.parse(responseData);
          if (responseDataJson.success === true || responseDataJson.error_code) {
            existingEntry = await transactionHistory.findOneAndUpdate(
              {id},
              {
                otps: null,
              status: "Cancelled",
              reason: "SMS not Received"
            },
            { new: true }  // Return the updated document);
          )}
          break;
  
        case "8":
          responseDataJson = JSON.parse(responseData);
          if (responseDataJson.success === true || responseDataJson.error_code) {
            existingEntry = await NumberHistory.findOneAndUpdate(
              {id},
              {
                otps: null,
              status: "Cancelled",
              reason: "SMS not Received"
            },
            { new: true }  // Return the updated document);
          );}
          break;
  
        case "9":
          if (responseData.startsWith("success")) {
            existingEntry = await NumberHistory.findOneAndUpdate(
              {id},
              {
              otps: null,  
              status: "Cancelled",
              reason: "SMS not Received"
            },
            { new: true }  // Return the updated document);
          );}
          break;
        case "10":
          if (responseData.startsWith("ACCESS_CANCEL")) {
            existingEntry = await NumberHistory.findOneAndUpdate(
              {id},
              {
              otps: null,  
              status: "Cancelled",
              reason: "SMS not Received"
            },
            { new: true }  // Return the updated document);
          );}
          break;
        case "11":
          if (responseData.request_id && responseData.success !== undefined) {
            existingEntry = await NumberHistory.findOneAndUpdate(
              {id},
              {
              otps: null,
              status: "Cancelled",
              reason: "SMS not Received"
            },
            { new: true }  // Return the updated document);
          );}
          break;
  
        default:
          return res.status(400).json({ error: "Invalid server value." });
      }
  
      if (otpReceived) {
        await Order.deleteOne({ numberId: id });
        return res.status(200).json({ access: "Otp Received" });
      }
  
      // Fetch IP details using the getIpDetails function
      const ipDetails = await getIpDetails(req);
      const { city, state, pincode, country, serviceProvider, ip } = ipDetails;
  
      const ipDetailsString = `\nCity: ${city}\nState: ${state}\nPincode: ${pincode}\nCountry: ${country}\nService Provider: ${serviceProvider}\nIP: ${ip}`;
  
      if (!existingEntry) {
        const formattedDateTime = moment().format("DD/MM/YYYYTHH:mm A");
  
        const transaction = await NumberHistory.findOne({ id });
  
        const numberHistory = new NumberHistory({
          userId: user._id,
          serviceName: transaction.serviceName,
          price: transaction.price,
          server,
          id,
          otps: null,
          status: "Cancelled",
          reason:"SMS not Received",
          number: transaction.number,
          date_time: formattedDateTime,
        });
        await numberHistory.save();
  
        if (!transaction.otp) {
          user.balance += parseFloat(transaction.price);
          user.balance = parseFloat(user.balance.toFixed(2));
          await user.save();
        }
        await numberCancelDetails({
          email: userData.email,
          serviceName: transaction.serviceName,
          price: transaction.price,
          server,
          number: transaction.number,
          balance: user.balance,
          ip: ipDetailsString,
        });
  
        await Order.deleteOne({ numberId: id });
      }
  
      if (
        thirdLastTransactions &&
        isWithinTime(thirdLastTransactions.date_time)
      ) {
        const checkForBlock = await BlockModel.findOne({
          block_type: "Number_Cancel",
        });
        if (!checkForBlock.status) {
          if (!userData.blocked) {
            userData.blocked = true;
            userData.blocked_reason = "Number Cancelled Repeatedly";
            await userData.save();
            await userBlockDetails({
              email: userData.email,
              ip: ipDetailsString,
              reason: "Number Cancel",
            });
          }
          res.status(403).json({ error: "Spam detected, user blocked." });
        } else res.status(200).json({ access: "Number Cancelled" });
      } else {
        res.status(200).json({ access: "Number Cancelled" });
      }
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
   
  };
  