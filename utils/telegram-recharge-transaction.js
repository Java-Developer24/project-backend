
import moment from "moment";
import fetch from "node-fetch";
import { RechargeHistory, NumberHistory } from "../models/history.js";

import ServerData from "../models/serverData.js";



const get24HoursAgo = () => {
  const start = moment().tz("Asia/Kolkata").startOf("day").format("DD/MM/YYYY HH:mm A"); // Today 12:00 AM
  const end = moment().tz("Asia/Kolkata").endOf("day").format("DD/MM/YYYY HH:mm A"); // Today 11:59 PM
 
  return { start, end };
};





const serverNames = {
  1: "Fastsms",
  2: "5Sim",
  3: "Smshub",
  4: "GrizzlySMS",
  5: "Tempnum",
  6: "Sms-activate",
  7: "Smsbower",
  8: "CCPAY",
 
};

const getServerBalance = async (server, apiKey) => {
  try {
    let url = "";
    let options = {};
    let currency = "";

    switch (server) {
      case 1:
        url = `https://fastsms.su/stubs/handler_api.php?api_key=${apiKey}&action=getBalance`;
        currency = "p"; // currency symbol for server 1
        break;
      case 2:
        url = `https://5sim.net/v1/user/profile`;
        options = {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
        };
        currency = "p"; // currency symbol for server 2
        break;
      case 3:
        url = `https://smshub.org/stubs/handler_api.php?api_key=${apiKey}&action=getBalance`;
        currency = "$"; // currency symbol for server 3
        break;
     
      case 4:
        url = `https://api.grizzlysms.com/stubs/handler_api.php?api_key=${apiKey}&action=getBalance`;
        currency = "p"; // currency symbol for server 5
        break;
      case 5:
        url = `https://tempnum.org/stubs/handler_api.php?api_key=${apiKey}&action=getBalance`;
        currency = "p"; // currency symbol for server 6
        break;
      case 6:
      url = `https://api.sms-activate.guru/stubs/handler_api.php?api_key=${apiKey}&action=getBalance`;
      currency = "$"; // currency symbol for server 7 and 8
      break;
      case 7:
      url=`https://smsbower.online/stubs/handler_api.php?api_key=${apiKey}&action=getBalance `;
      currency='p';
      break;
      
      case 8:
        url = `https://phpfiles.paidsms.org/p/ccpay.php?type=balance`;
        currency = "$"; // currency symbol for server 9
        break;
        
      default:
        return null;
    }

    if (url) {
      const response = await fetch(url, options);
      let balance;

      if (server === 2) {
        const data = await response.json();
        balance = data.balance.toString();
      }  else if (server === 8) {
        const data = await response.text();
        balance = data
      } else if (server === 10 ) {
        const data = await response.json();
        balance = data
      }else if (server === 11 ) {
        const data = await response.json();
        balance = data.balance.toString();
      }else {
        const data = await response.text();
        if (typeof data === "string" && data.includes("ACCESS_BALANCE:")) {
          balance = data.split("ACCESS_BALANCE:")[1].trim();
        } else {
          balance = data.trim();
        }
      }

      // Add the currency symbol
      return { balance: `${balance}${currency}`, currency };
    }
  } catch (error) {
    console.error(`Error fetching balance for server ${server}:`, error);
    return null;
  }
};

export const getServerDetails = async () => {
  try {
    const { start, end } = get24HoursAgo();
    // const { start, end } = get3MinutesAgo();


    // Fetch recent recharge history within the last 24 hours

    
    const recentRechargeHistory = await RechargeHistory.find({
      date_time: { $gte: start, $lt: end },
    });

    let totalAmount = 0;
    let trxTotal = 0;
    let upiTotal = 0;
    let adminAddedTotal = 0;

    // Calculate totals for different payment types
    recentRechargeHistory.forEach((recharge) => {
      const amount = parseFloat(recharge.amount);
      totalAmount += amount;
      if (recharge.method === "trx") {
        trxTotal += amount;
      } else if (recharge.method === "upi") {
        upiTotal += amount;
      } else if (recharge.method === "Admin") {
        adminAddedTotal += amount;
      }
    });

    // Fetch recent transaction history within the last 24 hours
    const recentTransactionHistory = await NumberHistory.find({
      date_time: { $gte: start, $lt: end },
    });
    
    // Group transactions by their ID
    const transactionsById = recentTransactionHistory.reduce(
      (acc, transaction) => {
        if (!acc[transaction.id]) {
          acc[transaction.id] = [];
        }
        acc[transaction.id].push(transaction);
        return acc;
      },
      {}
    );

    let soldCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    const serverCounts = {};

    for (const [id, transactions] of Object.entries(transactionsById)) {
      const hasFinished = transactions.some((txn) => txn.status === "Success");
      const hasCancelled = transactions.some((txn) => txn.status === "Cancelled");
      const hasOtp = transactions.some((txn) => txn.otp !== null);
    
      if (hasCancelled) {
        cancelledCount++;
      } else if (hasFinished && hasOtp) {
        soldCount++;
      } else if (hasFinished && !hasOtp) {
        pendingCount++;
      }
    
      const transactionWithOtp = transactions.find((txn) => txn.otp !== null);
    
      if (transactionWithOtp) {
        // Get the server associated with the OTP
        const server = transactionWithOtp.server;
    
        // Increment the count for that server
        if (!serverCounts[server]) {
          serverCounts[server] = 0;
        }
        serverCounts[server]++;
      }
    }
    
    // Fetch servers and their balances
    const servers = await ServerData.find();
    const serverBalances = await Promise.all(
      servers.map((server) => getServerBalance(server.server, server.api_key))
    );

    // Consolidate Server 7 and Server 8 balances
    const consolidatedServerBalances = servers.reduce((acc, server, index) => {
      const serverId = server.server;
      if (serverId === 7) {
        // Combine balances for server 7 and 8
        if (!acc[7]) {
          acc[7] = {
            balance: serverBalances[index].balance,
            currency: serverBalances[index].currency,
          };
        } else {
          const combinedBalance = (
            parseFloat(acc[7].balance) +
            parseFloat(serverBalances[index].balance)
          ).toFixed(2);
          acc[7] = {
            balance: `${combinedBalance}${serverBalances[index].currency}`,
            currency: serverBalances[index].currency,
          };
        }
      } else if (serverId !== 0) {
        acc[serverId] = serverBalances[index];
      }
      return acc;
    }, {});

    // Fetch total recharge balance
    const gettotalreacharge = await fetch(
      `${process.env.BACKEND_URL}/api/user/admin-api/all-users/get-all-users`
    );
   
    const usersData = await gettotalreacharge.json();
    

    const totalBalance = usersData.reduce(
      (accumulator, user) => accumulator + user.balance,
      0
    );

    // Fetch total user count
    const gettotalUserCount = await fetch(
      `${process.env.BACKEND_URL}/api/user/admin-api/total-users/total-user-count`
    );
    const totalUserCountData = await gettotalUserCount.json();

    // Format the results
    let result = `Date => ${moment().format("DD-MM-YYYY hh:mm:ssa")}\n\n`;
    result += `Total Number Selling Update\n`;
    result += `Total Sold       => ${soldCount}\n`;
    result += `Total Cancelled  => ${cancelledCount}\n`;
    result += `Total Pending    => ${pendingCount}\n\n`;

    result += `Number Selling Update Via Servers\n`;
    for (let i = 1; i <= 8; i++) {
      const count = serverCounts[i] || 0;
      result += `Server ${i} => ${count}\n`;
    }
    result += "\n";

    result += `Recharge Update\n`;
    result += `Total => ${totalAmount.toFixed(2)}\n`;
    result += `Trx   => ${trxTotal.toFixed(2)}\n`;
    result += `Upi   => ${upiTotal.toFixed(2)}\n`;
    result += `Admin Added => ${adminAddedTotal.toFixed(2)}\n\n`;

    result += `Servers Balance\n`;
    Object.keys(consolidatedServerBalances).forEach((serverId) => {
      const serverName = serverNames[serverId] || `Server${serverId}`;
      result += `${serverName} => ${consolidatedServerBalances[serverId].balance}\n`;
    });

    result += "\n";
    result += `Website Balance  => ${totalBalance.toFixed(2)}\n`;
    result += `Total User Count => ${totalUserCountData.totalUserCount}\n`;

    // Encode the result for URL
    const encodedResult = encodeURIComponent(result);

    // Send the message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot7311200292:AAGRdIotGRgeNNHdTlT7VtJCbK-wPef1hIg/sendMessage?chat_id=6769991787&text=${encodedResult}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
   
    throw error;
  }
};

export const scheduleJob = () => {
  console.log("Scheduling job...");

  // Run the job immediately for testing
  runJob();

  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const milliseconds = now.getMilliseconds();

  // Calculate the time until the next 30-minute interval
  const timeToNextInterval =
    (30 - (minutes % 30)) * 60 * 1000 - seconds * 1000 - milliseconds;

  setTimeout(() => {
    console.log("Starting scheduled job...");
    setInterval(runJob, 30 * 60 * 1000); // Run every 3 minutes
  }, timeToNextInterval);


};




const runJob = async () => {
  try {
    console.log("job running")
    const result = await getServerDetails();
    console.log(result);
  } catch (error) {
    console.error("Error running scheduled job:", error);
  }
};
