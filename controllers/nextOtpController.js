// controllers/nextOtpController.js
import axios from 'axios';
import User from '../models/user.js';
import  {telegramBot} from '../utils/telegram.js'
const telegram = telegramBot();

const smsManBaseUrl = 'https://api.sms-man.com/control';

const apiKeys = {
    fastsms: 'd91be54bb695297dd517edfdf7da5add',
    smshub: '187351Ucca41bb308f7b88a7c6f390a27f8ce6c',
    tigersms: 'aHy99pGILr2nqgamVsqHZBLwjaTRHPua',
    grizzlysms: '0bbe5066f4b8345c1c74bcbb1d97985f',
    tempnum: 'c66ea248c3beaf2e4a3d9e96a41fb37e',
    smsbower: 'qyeyL8nggrQohcefuaIWiWuRztWyK5r0',
    smsactivate: '7b4252022A08d40A84fA6dc153781f4f',
    smsactivationservice: 'cbfa000d81dbfbc4e2d4ba3484fa5a5a',
    ccpay : 'd1967b3a7609f20d010907ed41af1596',
    smsman: 'kdB2QOTDWF6hwgywghVwQGvKNALFoZnU',
};


const nextOtp = async (req, res) => {
    console.time("nextOtp")
     const { userId, serverNumber, id, serviceName, price, number ,orderId} = req.body;
      try {
           const user = await User.findById(userId).lean();
        if (!user) {
              console.log("User not found")
            return res.status(404).json({ message: 'User not found' });
        }
        let response;
           switch (parseInt(serverNumber)) {
            case 1:
                 console.log("fastsms next otp request started");
                response = await axios.get(`https://fastsms.su/stubs/handler_api.php?api_key=${apiKeys.fastsms}&action=setStatus&id=${id}&status=3`);
                 console.log("fastsms next otp request completed");
                 res.status(200).json({ message: 'Next OTP requested' });
                 break;
            case 3:
                console.log("smshub next otp request started");
                  response = await axios.get(`https://smshub.org/stubs/handler_api.php?api_key=${apiKeys.smshub}&action=setStatus&status=3&id=${id}`);
                    console.log("smshub next otp request completed");
                  res.status(200).json({ message: 'Next OTP requested' });
                break;
              case 5:
                 console.log("grizzlysms next otp request started");
                response = await axios.get(`https://api.grizzlysms.com/stubs/handler_api.php?api_key=${apiKeys.grizzlysms}&action=setStatus&status=3&id=${id}`);
                   console.log("grizzlysms next otp request completed");
                 res.status(200).json({ message: 'Next OTP requested' });
                break;
            case 7:
                 console.log("smsbower next otp request started");
                response = await axios.get(`https://smsbower.online/stubs/handler_api.php?api_key=${apiKeys.smsbower}&action=setStatus&status=3&id=${id}`);
                   console.log("smsbower next otp request completed");
                 res.status(200).json({ message: 'Next OTP requested' });
                break;
           case 8:
                 console.log("smsactivate next otp request started");
                 response = await axios.get(`https://api.sms-activate.io/stubs/handler_api.php?api_key=${apiKeys.smsactivate}&action=setStatus&status=3&id=${id}`);
                  console.log("smsactivate next otp request completed");
                  res.status(200).json({ message: 'Next OTP requested' });
                break;
           case 11:
                 console.log("smsman next otp request started");
                 const smsManResponse = await axios.get(`${smsManBaseUrl}/set-status?token=${apiKeys.smsman}&request_id=${id}&status=retrysms`);
                   console.log("smsman next otp request completed");
                 res.status(200).json(smsManResponse.data);
                break;
            default:
               console.log("Invalid server number")
                return res.status(400).json({ message: 'Invalid server number' });
        }
          console.timeEnd("nextOtp")
    } catch (error) {
          console.timeEnd("nextOtp")
        console.error('Error requesting next OTP:', error);
        res.status(500).json({ message: 'Error requesting next OTP', error: error.message });
    }
};


export default nextOtp;