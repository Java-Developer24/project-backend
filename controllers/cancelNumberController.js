// controllers/cancelNumberController.js
import axios from 'axios';
import User from '../models/user.js';
import NumberHistory from '../models/history.js';
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


const cancelNumber = async (req, res) => {
     console.time("cancelNumber");
     const { userId, serverNumber, id, serviceName, price, number, orderId } = req.body;
      try {
        const user = await User.findById(userId).lean();
        if (!user) {
             console.log("User not found")
            return res.status(404).json({ message: 'User not found' });
        }
        let response;
           switch (parseInt(serverNumber)) {
            case 1:
                  console.log("fastsms cancel number request started");
                response = await axios.get(`https://fastsms.su/stubs/handler_api.php?api_key=${apiKeys.fastsms}&action=setStatus&id=${id}&status=8`);
                console.log("fastsms cancel number request completed");
                 await updateNumberHistory(userId,number,serviceName,serverNumber,price, 'Number Cancelled',orderId, 'Cancelled');
                await telegram.sendNumberCancelNotification(user,serviceName,price, serverNumber,number, 'Number Cancelled'); //telegram notification
                res.status(200).json({ message: 'Number cancelled' });
                break;
             case 2:
                    console.log("5sim cancel number request started");
                 const token = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTU4NjQ1MDYsImlhdCI6MTcyNDMyODUwNiwicmF5IjoiOWMyYTg1NmM4ZjQ2YmNlZWFmZThjOWI4OTE1MTM4NWQiLCJzdWIiOjI2ODY5Nzl9.1EZHone0nsBX6gGlK6vS3sOPXj72-JYPyqLxPmd0F0OU4x5EbMwlUqVD7spF56Q2V_Xh1Db1H3wbgvlF2NmrSrJN-_Mp6D8yTmCWq7bCwm9aH6GmHVKnI1TtoK6b02dg5yNdmrnkuxnUbeSM7a9pBOMynZQJMbegF_0XPf0zLt0s62lhmrLKMGdmpmh4LH6fN5umwVcRte-Up1rg4jz_oWY1DxZAI1Q5z_zKsIb01XWuoPNWZwe5bOE8RgzQ-1n0Cxm8xc48cp-P15vvUPxJk1j3E_8skJgNnN0QJQ4UDZlwIiaj5MF5By7Pge9mCwEHbUPsHR7NAsIGeNMc74he8Q'
                    const cancelResponse2 = await axios.get(`https://5sim.net/v1/user/cancel/${id}`,{
                         headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                    })
                     console.log("5sim cancel number request completed");
                   await updateNumberHistory(userId,number,serviceName,serverNumber,price, 'Number Cancelled',orderId, 'Cancelled');
                   await telegram.sendNumberCancelNotification(user,serviceName,price, serverNumber,number, 'Number Cancelled'); //telegram notification
                    res.status(200).json({message: 'Number cancelled'});
                break;
           case 3:
                console.log("smshub cancel number request started");
                response = await axios.get(`https://smshub.org/stubs/handler_api.php?api_key=${apiKeys.smshub}&action=setStatus&status=8&id=${id}`);
                  console.log("smshub cancel number request completed");
                 await updateNumberHistory(userId,number,serviceName,serverNumber,price, 'Number Cancelled',orderId, 'Cancelled');
                  await telegram.sendNumberCancelNotification(user,serviceName,price, serverNumber,number, 'Number Cancelled'); //telegram notification
                res.status(200).json({ message: 'Number cancelled' });
                break;
              case 4:
                  console.log("tigersms cancel number request started");
                 response = await axios.get(`https://api.tiger-sms.com/stubs/handler_api.php?api_key=${apiKeys.tigersms}&action=setStatus&status=8&id=${id}`);
                   console.log("tigersms cancel number request completed");
                 await updateNumberHistory(userId,number,serviceName,serverNumber,price, 'Number Cancelled',orderId, 'Cancelled');
                 await telegram.sendNumberCancelNotification(user,serviceName,price, serverNumber,number, 'Number Cancelled'); //telegram notification
                   res.status(200).json({ message: 'Number cancelled' });
                break;
              case 5:
                 console.log("grizzlysms cancel number request started");
                 response = await axios.get(`https://api.grizzlysms.com/stubs/handler_api.php?api_key=${apiKeys.grizzlysms}&action=setStatus&status=8&id=${id}`);
                    console.log("grizzlysms cancel number request completed");
                 await updateNumberHistory(userId,number,serviceName,serverNumber,price, 'Number Cancelled',orderId, 'Cancelled');
                  await telegram.sendNumberCancelNotification(user,serviceName,price, serverNumber,number, 'Number Cancelled'); //telegram notification
                  res.status(200).json({ message: 'Number cancelled' });
                break;
              case 6:
                   console.log("tempnum cancel number request started");
                 response = await axios.get(`https://tempnum.org/stubs/handler_api.php?api_key=${apiKeys.tempnum}&action=setStatus&status=8&id=${id}`);
                   console.log("tempnum cancel number request completed");
                 await updateNumberHistory(userId,number,serviceName,serverNumber,price, 'Number Cancelled',orderId, 'Cancelled');
                   await telegram.sendNumberCancelNotification(user,serviceName,price, serverNumber,number, 'Number Cancelled'); //telegram notification
                  res.status(200).json({ message: 'Number cancelled' });
                break;
             case 7:
                 console.log("smsbower cancel number request started");
                 response = await axios.get(`https://smsbower.online/stubs/handler_api.php?api_key=${apiKeys.smsbower}&action=setStatus&status=8&id=${id}`);
                  console.log("smsbower cancel number request completed");
                   await updateNumberHistory(userId,number,serviceName,serverNumber,price, 'Number Cancelled',orderId, 'Cancelled');
                  await telegram.sendNumberCancelNotification(user,serviceName,price, serverNumber,number, 'Number Cancelled'); //telegram notification
                  res.status(200).json({ message: 'Number cancelled' });
                break;
            case 8:
                  console.log("smsactivate cancel number request started");
                 response = await axios.get(`https://api.sms-activate.io/stubs/handler_api.php?api_key=${apiKeys.smsactivate}&action=setStatus&status=8&id=${id}`);
                   console.log("smsactivate cancel number request completed");
                   await updateNumberHistory(userId,number,serviceName,serverNumber,price, 'Number Cancelled',orderId, 'Cancelled');
                   await telegram.sendNumberCancelNotification(user,serviceName,price, serverNumber,number, 'Number Cancelled'); //telegram notification
                 res.status(200).json({ message: 'Number cancelled' });
                break;
            case 9:
                  console.log("ccpay cancel number request started");
                    const cancelResponse9 = await axios.get(`https://own5k.in/p/ccpay.php?type=cancel&number=${number}`);
                  console.log("ccpay cancel number request completed");
                   await updateNumberHistory(userId,number,serviceName,serverNumber,price, 'Number Cancelled',orderId, 'Cancelled');
                    await telegram.sendNumberCancelNotification(user,serviceName,price, serverNumber,number, 'Number Cancelled'); //telegram notification
                   res.status(200).json({ message: 'Number cancelled' });
                 break;
             case 10:
                    console.log("smsactivationservice cancel number request started");
                 response = await axios.get(`https://sms-activation-service.com/stubs/handler_api?api_key=${apiKeys.smsactivationservice}&action=setStatus&id=${id}&status=8`);
                   console.log("smsactivationservice cancel number request completed");
                    await updateNumberHistory(userId,number,serviceName,serverNumber,price, 'Number Cancelled',orderId, 'Cancelled');
                    await telegram.sendNumberCancelNotification(user,serviceName,price, serverNumber,number, 'Number Cancelled'); //telegram notification
                  res.status(200).json({ message: 'Number cancelled' });
                 break;
            case 11:
                  console.log("smsman cancel number request started");
                 const smsManResponse = await axios.get(`${smsManBaseUrl}/set-status?token=${apiKeys.smsman}&request_id=${id}&status=reject`);
                 console.log("smsman cancel number request completed");
                  await updateNumberHistory(userId,number,serviceName,serverNumber,price, 'Number Cancelled',orderId, 'Cancelled');
                  await telegram.sendNumberCancelNotification(user,serviceName,price, serverNumber,number, 'Number Cancelled'); //telegram notification
                res.status(200).json(smsManResponse.data);
                break;
            default:
                 console.log("Invalid server number")
                return res.status(400).json({ message: 'Invalid server number' });
        }
         console.timeEnd("cancelNumber");
    } catch (error) {
        console.error('Error cancelling number:', error);
        res.status(500).json({ message: 'Error cancelling number', error: error.message });
    }
};


 const updateNumberHistory = async (userId, number, serviceName, server, price, otp,orderId, status='Success') => {
    try {
         await NumberHistory.findOneAndUpdate({userId:userId, number:number, serviceName:serviceName, server:server,price:price, orderId:orderId},{otp:otp, status: status}, { new: true });
    }
    catch (error) {
       console.error('Error update number history:', error);
        throw error;
    }
}
export default cancelNumber;