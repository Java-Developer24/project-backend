import moment from "moment";
import Service from '../models/service.js';
import { NumberHistory } from "./../models/history.js";
import User from "../models/user.js";
import { userDiscountModel } from '../models/userDiscount.js'
;import { getIpDetails } from "../utils/getIpDetails.js";
import { Order } from "./../models/order.js";
import fetch from "node-fetch";
import ServerData from "../models/serverData.js";
import {

    numberGetDetails,
   
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
        return `https://api.tiger-sms.com/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&country=22`;
  
      case "5":
        return `https://api.grizzlysms.com/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&country=22`;
  
      case "6":
        return `https://tempnum.org/stubs/handler_api.php?api_key=${api_key_server}&action=getNumber&service=${data.code}&country=22`;
  
      case "7":
        return `https://api2.sms-man.com/control/get-number?token=${api_key_server}&application_id=${data.code}&country_id=14&hasMultipleSms=false`;
  
      case "8":
        return `https://api2.sms-man.com/control/get-number?token=${api_key_server}&application_id=${data.code}&country_id=14&hasMultipleSms=true`;
  
      case "9":
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
      const { servicecode, api_key, server } = req.query;
  
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
  
      const apiUrl = constructApiUrl(server, api_key_server, serviceData);
  
      let response, responseData;
      let retry = true;
  
      for (let attempt = 0; attempt < 2 && retry; attempt++) {
        if (typeof apiUrl === "string") {
          response = await fetch(apiUrl);
        } else {
          response = await fetch(apiUrl.url, { headers: apiUrl.headers });
        }
  
        if (!response.ok) {
          throw new Error("No numbers available. Please try different server.");
        }
  
        responseData = await response.text();
  
        if (!responseData) {
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
      price = parseFloat((price + totalDiscount).toFixed(2));
  
      user.balance -= price;
      user.balance = parseFloat(user.balance.toFixed(2));
      await user.save();
  
      const formattedDateTime = moment().format("MM/DD/YYYYTHH:mm:ss A");
  
      const numberHistory = new NumberHistory({
        userId: user._id,
        serviceName: sname,
        price,
        server,
        id,
        otps: null,
        status: "Success",
        number,
        date_time: formattedDateTime,
      });
      await numberHistory.save();
  
    //   const { city, state, pincode, country, serviceProvider, ip } = ipDetails;
    //   const ipDetailsString = `\nCity: ${city}\nState: ${state}\nPincode: ${pincode}\nCountry: ${country}\nService Provider: ${serviceProvider}\nIP: ${ip}`;
  
    //   await numberGetDetails({
    //     email: userData.email,
    //     serviceName: sname,
    //     serviceCode: serviceData.code,
    //     price,
    //     server,
    //     number,
    //     balance: user.balance,
    //     ip: ipDetailsString,
    //   });
  
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 20);
  
      const newOrder = new Order({
        userId: user._id,
        service: sname,
        price,
        server,
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
  
  const checkAndCancelExpiredOrders = async () => {
    try {
      const currentTime = new Date();
      const expiredOrders = await Order.find({
        expirationTime: { $lte: new Date(currentTime.getTime() + 60000) },
      });
  
      for (const order of expiredOrders) {
        const timeDifference =
          new Date(order.expirationTime).getTime() -
          currentTime.getTime() -
          60000;
        if (timeDifference >= 0) {
          setTimeout(() => cancelOrder(order), timeDifference);
        } else {
          // Get the API key
          const user = await User.findOne({ userId: order.userId });
  
          // Call the numberCancel function
          await fetch(
            `${process.env.BASE_URL}/api/number-cancel?api_key=${user.api_key}&id=${order.numberId}&server=${order.server}`
          );
        }
      }
    } catch (error) {
      console.error("Error in checkAndCancelExpiredOrders:", error.message);
    }
  };
  export const cancelOrder = async (order) => {
    try {
      // Get the API key
      const user = await User.findOne({ userId: order.userId });
  
      if (user && user.api_key) {
        // Call the numberCancel function
        await fetch(
          `${process.env.BASE_URL}/api/service/number-cancel?api_key=${user.api_key}&id=${order.numberId}&server=${order.server}`
        );
      } else {
        console.error(`No API key found for user ${order.userId}`);
      }
    } catch (error) {
      console.error(`Error cancelling order ${order._id}:`, error.message);
    }
  };

  const getOtp = async (req, res) => {
    try {
      const { id, api_key, server } = req.query;
      console.log(id)
  
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
          apiUrl = `https://api2.sms-man.com/control/get-sms?token=${api_key_server}&request_id=${id}`;
          break;
  
        case "8":
          apiUrl = `https://api2.sms-man.com/control/get-sms?token=${api_key_server}&request_id=${id}`;
          break;
  
        case "9":
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
          // Check if the response data includes "OK" followed by the OTP
          if (responseData.startsWith("STATUS_OK")) {
            // Split the response data to extract the OTP
            const parts = responseData.split(":");
            const otp = parts[1]; // Trim to remove any leading or trailing spaces
  
            validOtp = otp;
          }
          break;
  
        case "6":
          // Check if the response data includes "OK" followed by the OTP
          if (responseData.startsWith("STATUS_OK")) {
            // Split the response data to extract the part after "STATUS_OK:"
            const parts = responseData.split(":");
            const otp = parts[1].trim(); // Trim to remove any leading or trailing spaces
  
            validOtp = otp;
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
          responseDataJson = JSON.parse(responseData);
          const otp = responseDataJson.data.verificationCode[0].vc;
          validOtp = otp;
          break;
  
        default:
          return res.status(400).json({ error: "Invalid server value." });
      }
      console.log("userids",validOtp)

      if (validOtp) {
        const existingEntry = await NumberHistory.findOne({
          id,
          otp: validOtp,
        });
        console.log(existingEntry)
       
  
        if (!existingEntry) { 
          // Format the current date and time using Moment.js
          const formattedDateTime = moment().format("MM/DD/YYYYTHH:mm:ss A");
          console.log("id",id)
          // Find the corresponding transaction history entry
          // const transaction = await NumberHistory.findOne({ id });
          

          // Create a new transactionHistory instance and save it to the database
          const numberHistory = new NumberHistory({
            userId: user._id,
            service: transaction.service,
            price: transaction.price,
            server,
            id,
            otp: validOtp,
            status: "Success",
            number: transaction.number,
            date_time: formattedDateTime,
          });
          await numberHistory.save();
  
          // Fetch IP details using the getIpDetails function
          const ipDetails = await getIpDetails(req);
        //   // Destructure IP details
        //   const { city, state, pincode, country, serviceProvider, ip } =
        //     ipDetails;
  
          // Pass the destructured IP details to the numberGetDetails function as a multiline string
        //   const ipDetailsString = `\nCity: ${city}\nState: ${state}\nPincode: ${pincode}\nCountry: ${country}\nService Provider: ${serviceProvider}\nIP: ${ip}`;
  
        //   await otpGetDetails({
        //     email: userData.email,
        //     serviceName: transaction.service,
        //     price: transaction.price,
        //     server,
        //     number: transaction.number,
        //     otp: validOtp,
        //     ip: ipDetailsString,
        //   });
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
    const dateTimeValue = moment(date_time, "MM/DD/YYYYTHH:mm:ss A");
  
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
  
      const user = await User.findOne({ apiKey:api_key });
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
  
      if (data.some((t) => t.otp)) {
        await Order.deleteOne({ numberId: id });
        return res.status(200).json({ access: "Otp Received" });
      }
  
      if (data.some((t) => t.status === "CANCELLED")) {
        return res.status(200).json({ access: "Number Cancelled" });
      }
      userTransactions = userTransactions
        .filter((u) => u.status === "CANCELLED")
        .reverse();
  
      let thirdLastTransactions = null;
  
      if (userTransactions.length >= 10) {
        thirdLastTransactions = userTransactions[9];
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
          apiUrl = `https://api2.sms-man.com/control/set-status?token=${serverData.api_key}&request_id=${id}&status=reject`;
          break;
  
        case "8":
          apiUrl = `https://api2.sms-man.com/control/set-status?token=${serverData.api_key}&request_id=${id}&status=reject`;
          break;
  
        case "9":
          apiUrl = `https://php.paidsms.in/p/ccpay.php?type=cancel&number=${data.number}`;
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
          // Check if the response data includes "OK" followed by the OTP
          if (responseData.startsWith("ACCESS_CANCEL")) {
            existingEntry = await NumberHistory.findOne({
              id,
              status: "Cancelled",
            });
          }
  
          if (responseData.startsWith("ACCESS_APPROVED")) {
            otpReceived = true;
          }
  
          break;
  
        case "2":
          responseDataJson = JSON.parse(responseData);
          if (responseDataJson.status === "CANCELED") {
            existingEntry = await NumberHistory.findOne({
              id,
              status: "Cancelled",
            });
          }
          if (responseDataJson.status === "order has sms") {
            otpReceived = true;
          }
          break;
  
        case "3":
          // Check if the response data includes "OK" followed by the OTP
          if (responseData.startsWith("ACCESS_CANCEL")) {
            existingEntry = await NumberHistory.findOne({
              id,
              status: "Cancelled",
            });
          }
          break;
  
        case "4":
          // Check if the response data includes "OK" followed by the OTP
          if (
            responseData.startsWith("ACCESS_CANCEL") ||
            responseData.startsWith("BAD_STATUS")
          ) {
            existingEntry = await NumberHistory.findOne({
              id,
              status: "Cancelled",
            });
          }
          break;
  
        case "5":
          // Check if the response data includes "OK" followed by the OTP
          if (
            responseData.startsWith("ACCESS_CANCEL") ||
            responseData.startsWith("BAD_ACTION")
          ) {
            existingEntry = await NumberHistory.findOne({
              id,
              status: "Cancelled",
            });
          }
          break;
  
        case "6":
          // Check if the response data includes "OK" followed by the OTP
          if (
            responseData.startsWith("ACCESS_CANCEL") ||
            responseData.startsWith("NO_ACTIVATION")
          ) {
            existingEntry = await NumberHistory.findOne({
              id,
              status: "Cancelled",
            });
          }
          break;
  
        case "7":
          responseDataJson = JSON.parse(responseData);
          // Check if the response data includes "OK" followed by the OTP
          if (responseDataJson.success === true || responseDataJson.error_code) {
            existingEntry = await transactionHistory.findOne({
              id,
              status: "Cancelled",
            });
          }
          break;
  
        case "8":
          responseDataJson = JSON.parse(responseData);
          // Check if the response data includes "OK" followed by the OTP
          if (responseDataJson.success === true || responseDataJson.error_code) {
            existingEntry = await NumberHistory.findOne({
              id,
              status: "Cancelled",
            });
          }
          break;
  
        case "9":
          // Check if the response data includes "OK" followed by the OTP
          if (responseData.startsWith("success")) {
            existingEntry = await NumberHistory.findOne({
              id,
              status: "Cancelled",
            });
          }
          break;
  
        default:
          return res.status(400).json({ error: "Invalid server value." });
      }
  
      if (otpReceived) {
        await Order.deleteOne({ numberId: id });
        return res.status(200).json({ access: "Otp Received" });
      }
  
    //   // Fetch IP details using the getIpDetails function
    //   const ipDetails = await getIpDetails(req);
    //   // Destructure IP details
    //   const { city, state, pincode, country, serviceProvider, ip } = ipDetails;
  
    //   // Pass the destructured IP details to the numberGetDetails function as a multiline string
    //   const ipDetailsString = `\nCity: ${city}\nState: ${state}\nPincode: ${pincode}\nCountry: ${country}\nService Provider: ${serviceProvider}\nIP: ${ip}`;
  
      if (!existingEntry) {
        // Format the current date and time using Moment.js
        const formattedDateTime = moment().format("MM/DD/YYYYTHH:mm:ss A");
  
        // Find the corresponding transaction history entry
        const transaction = await NumberHistory.findOne({ id });
        
  
        // Create a new transactionHistory instance and save it to the database
        const numberHistory = new NumberHistory({
          userId: user._id,
          serviceName: transaction.serviceName,
          price: transaction.price,
          server,
          id,
          otp: null,
          status: "Cancelled",
          number: transaction.number,
          date_time: formattedDateTime,
        });
        await numberHistory.save();
  
        if (!transaction.otp) {
          user.balance += parseFloat(transaction.price);
          // Format balance to 2 decimal places
          user.balance = parseFloat(user.balance.toFixed(2));
          await user.save();
        }
        // await numberCancelDetails({
        //   email: userData.email,
        //   serviceName: transaction.service,
        //   price: transaction.price,
        //   server,
        //   number: transaction.number,
        //   balance: user.balance,
        //   ip: ipDetailsString,
        // });
        // Delete the order associated with the cancelled number
        await Order.deleteOne({ numberId: id });
      }
  
      // Check for spam and block user if necessary
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
  