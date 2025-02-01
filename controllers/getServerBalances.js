import axios from "axios"
import ServerData from "../models/serverData.js";



// Define functions to fetch balances for each server
const getServer1Balance = async () => {
  try {
    const serverData = await ServerData.findOne({ server: "1" });
    if (!serverData) throw new Error("Server data not found");
    const response = await axios.get(
      `https://fastsms.su/stubs/handler_api.php?api_key=${serverData.api_key}&action=getBalance`
    );
    const parts = response.data.split(":");
    return { balance: parseFloat(parts[1]), currency: "p" };
  } catch (error) {
    console.error("Error fetching Server 1 balance:", error.message);
    return {};
  }
};

const getServer2Balance = async () => {
  try {
    const serverData = await ServerData.findOne({ server: "2" });
    if (!serverData) throw new Error("Server data not found");
    const response = await axios.get("https://5sim.net/v1/user/profile", {
      headers: {
        Authorization: `Bearer ${serverData.api_key}`,
        Accept: "application/json",
      },
    });
    return { balance: parseFloat(response.data.balance), currency: "p" };
  } catch (error) {
    console.error("Error fetching Server 2 balance:", error.message);
    return {};
  }
};

const getServer3Balance = async () => {
  try {
    const serverData = await ServerData.findOne({ server: "3" });
    if (!serverData) throw new Error("Server data not found");
    const response = await axios.get(
      `https://smshub.org/stubs/handler_api.php?api_key=${serverData.api_key}&action=getBalance`
    );
    const parts = response.data.split(":");
    return { balance: parseFloat(parts[1]), currency: "$" };
  } catch (error) {
    console.error("Error fetching Server 3 balance:", error.message);
    return {};
  }
};

const getServer4Balance = async () => {
  try {
    const serverData = await ServerData.findOne({ server: "4" });
    if (!serverData) throw new Error("Server data not found");
    const response = await axios.get(
      `https://api.grizzlysms.com/stubs/handler_api.php?api_key=${serverData.api_key}&action=getBalance`
    );
    const parts = response.data.split(":");
    return { balance: parseFloat(parts[1]), currency: "p" };
  } catch (error) {
    console.error("Error fetching Server 4 balance:", error.message);
    return {};
  }
};

const getServer5Balance = async () => {
  try {
    const serverData = await ServerData.findOne({ server: "5" });
    if (!serverData) throw new Error("Server data not found");
    const response = await axios.get(
      `https://tempnum.org/stubs/handler_api.php?api_key=${serverData.api_key}&action=getBalance`
    );
    const parts = response.data.split(":");
    return { balance: parseFloat(parts[1]), currency: "p" };
  } catch (error) {
    console.error("Error fetching Server 5 balance:", error.message);
    return {};
  }
};

const getServer6Balance = async () => {
  try {
    const serverData = await ServerData.findOne({ server: "6" });
    if (!serverData) throw new Error("Server data not found");
    const response = await axios.get(
      `https://api.sms-activate.guru/stubs/handler_api.php?api_key=${serverData.api_key}&action=getBalance`
    );
    const parts = response.data.split(":");
    return { balance: parseFloat(parts[1]), currency: "$" };
  } catch (error) {
    console.error("Error fetching Server 6 balance:", error.message);
    return {};
  }
};

const getServer8Balance = async () => {
  try {
    
    const response = await axios.get(
      "https://own5k.in/p/ccpay.php?type=balance"
    );
    
    return { balance: parseFloat(response.data), currency: "$" };
  } catch (error) {
    console.error("Error fetching Server 8 balance:", error.message);
    return {};
  }
};

const getServer7Balance = async () => {
  try {
    const serverData = await ServerData.findOne({ server: "7" });
   
    if (!serverData) throw new Error("Server data not found");
    const response = await axios.get(
      `https://smsbower.online/stubs/handler_api.php?api_key=${serverData.api_key}&action=getBalance`
    );
    console.log(response)
    const parts = response.data.split(":");
    return { balance: parseFloat(parts[1]), currency: "p" };
  } catch (error) {
    console.error("Error fetching Server 7 balance:", error.message);
    return {"balance": null,
        "currency": "$"};
  }
};

// Combine all balance functions
export const serverBalances= async (req, res) => {
  try {
    const balances = {
      server1: await getServer1Balance(),
      server2: await getServer2Balance(),
      server3: await getServer3Balance(),
      server4: await getServer4Balance(),
      server5: await getServer5Balance(),
      server6: await getServer6Balance(),
      server7: await getServer7Balance(),
      server8: await getServer8Balance(),
      


      
    };
    res.json(balances);
  } catch (error) {
    console.error('Error fetching balances:', error);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
};

// Start server

