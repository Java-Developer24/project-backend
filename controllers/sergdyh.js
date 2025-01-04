import ServerData from "../models/serverData";

const getTransactionHistoryUser = async (req, res) => {
    try {
      // Extract email from URL parameters
      const { userId } = req.query;
  
      const maintainanceServerData = await ServerData.findOne({ server: 0 });
      if (maintainanceServerData.maintainance) {
        return res.status(403).json({ error: "Site is under maintenance." });
      }
  
      // Query recharge history data based on the email ID
      const transactionHistoryData = await NumberHistory.find(
        { userId },
        "-_id -__v"
      );
  
      if (!transactionHistoryData || transactionHistoryData.length === 0) {
        return res.json({
          message: "No transaction history found for the provided userId",
        });
      }
  
      res.status(200).json(transactionHistoryData.reverse());
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      res.status(500).json({ error: "Failed to fetch transaction history" });
    }
  };
  

  const mongoose = require('mongoose');

// Define the schema (if not already defined)
const serverSchema = new mongoose.Schema({
  ID: String,
  server: Number,
  maintainance: Boolean,
  api_key: String,
  block: Boolean,
  token: String,
  exchangeRate: Number,
  margin: Number,
  discount: Number,
  createdAt: Date,
  updatedAt: Date,
});

const Server = mongoose.model('Server', serverSchema);

// Function to get margin for server 0
async function getMarginForServer0() {
  try {
    // Query the database for the server with `server: 0`
    const serverData = await Server.findOne({ server: 0 }).select('margin');

    if (serverData) {
      console.log(`Margin for server 0: ${serverData.margin}`);
      return serverData.margin;
    } else {
      console.log('No data found for server 0.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching margin for server 0:', error);
    throw error;
  }
}

// Call the function
getMarginForServer0();



const GetNumber = () => {
  // existing state and functions

  const getOTPFromTransaction = (numberId) => {
    const relatedTransactions = transactions.filter(
      (transaction) => transaction.numberId === numberId
    );

    if (relatedTransactions.length === 0) {
      return ["Waiting for SMS"]; // If no transaction found
    }

    const otpList = relatedTransactions
      .map((transaction) => transaction.otps)
      .filter((otps) => otps !== null);

    // Extracting the OTP messages from the array of OTP objects
    const otpMessages = otpList.flatMap((otpArray) =>
      otpArray.map((otp) => otp.message.trim()) // Ensure that the message is trimmed of unnecessary spaces
    );

    return otpMessages.length > 0 ? otpMessages : ["Waiting for SMS"];
  };

  return (
    <div className="h-[calc(100dvh-4rem)] overflow-y-auto hide-scrollbar">
      {loading ? (
        <div className="w-full flex h-full justify-center items-center">
          <SnapLoader />
        </div>
      ) : orders.length === 0 ? (
        <div className="h-[calc(100dvh-4rem)] flex items-center justify-center relative">
          <h1 className="text-[28px] lg:text-[55px] leading-[30px] lg:leading-[55px] font-[600] lg:font-[500] text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="text-primary">No</span> Active Orders
          </h1>
        </div>
      ) : (
        orders.map((order) => {
          const otps = getOTPFromTransaction(order.numberId); // Get the OTPs for the order
          const hasOtp = otps.some((otp) => otp !== "Waiting for SMS");

          return (
            <div className="w-full flex justify-center my-12" key={order._id}>
              <div className="w-full max-w-[520px] flex flex-col items-center border-2 border-[#1b1d21] bg-[#121315] rounded-2xl p-5">
                {/* Order Details Section */}
                <div className="w-full flex flex-col items-center px-4 mb-4 text-sm font-normal gap-y-2">
                  <div className="w-full flex text-center items-center justify-between">
                    <p>Service:</p>
                    <span>{order.service}</span>
                  </div>
                  <hr className="border-[#888888] border w-full" />
                  <div className="w-full flex text-center items-center justify-between">
                    <p>Server:</p>
                    <span>{order.server}</span>
                  </div>
                  <hr className="border-[#888888] border w-full" />
                  <div className="w-full flex text-center items-center justify-between">
                    <p>Price:</p>
                    <span>₹{order.price}</span>
                  </div>
                </div>

                {/* OTP Section */}
                <div className="w-full flex bg-[#444444] border-2 border-[#888888] rounded-2xl items-center justify-center max-h-[100px] overflow-y-scroll hide-scrollbar">
                  <div className="w-full h-full flex flex-col items-center">
                    {otps.map((otpMessage, index) => (
                      <React.Fragment key={index}>
                        <div className="bg-transparent py-4 px-5 flex w-full items-center justify-center">
                          <h3 className="font-normal text-sm">{otpMessage}</h3>
                        </div>
                        {index < otps.length - 1 && <hr className="border-[#888888] border w-full" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Other components like Countdown, Buttons */}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
