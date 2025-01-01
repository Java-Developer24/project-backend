// controllers/getOtpController.js
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


const getOtp = async (req, res) => {
  console.time("getOtp")
     const { userId, serverNumber, id, serviceName, price, number, orderId } = req.body;
     try {
        const user = await User.findById(userId).lean();
        if (!user) {
              console.log("User not found")
            return res.status(404).json({ message: 'User not found' });
        }

       let response;
        let otp = '';
        switch (parseInt(serverNumber)) {
            case 1:
                   console.log("fastsms otp request started");
                response = await axios.get(`https://fastsms.su/stubs/handler_api.php?api_key=${apiKeys.fastsms}&action=getStatus&id=${id}`);
                if (response.data.includes('STATUS_CANCEL')) {
                         console.log("Number cancelled")
                        return res.status(400).json({ message: 'Number cancelled' });
                    }
                 if (response.data.includes('STATUS_WAIT_CODE')) {
                         console.log("waiting for otp")
                        return res.status(200).json({ message: 'Waiting for OTP' });
                }
                const [_, extractedOtp] = response.data.split(':');
                  console.log("fastsms otp request completed");
                otp= extractedOtp;
                 await updateNumberHistory(userId,number,serviceName,serverNumber,price, otp,orderId);
                 await telegram.sendOtpNotification(user,serviceName,price, serverNumber,number,otp) //telegram notification
                  res.status(200).json({ otp });
                break;
             case 2:
                   console.log("5sim otp request started");
                  const token = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTU4NjQ1MDYsImlhdCI6MTcyNDMyODUwNiwicmF5IjoiOWMyYTg1NmM4ZjQ2YmNlZWFmZThjOWI4OTE1MTM4NWQiLCJzdWIiOjI2ODY5Nzl9.1EZHone0nsBX6gGlK6vS3sOPXj72-JYPyqLxPmd0F0OU4x5EbMwlUqVD7spF56Q2V_Xh1Db1H3wbgvlF2NmrSrJN-_Mp6D8yTmCWq7bCwm9aH6GmHVKnI1TtoK6b02dg5yNdmrnkuxnUbeSM7a9pBOMynZQJMbegF_0XPf0zLt0s62lhmrLKMGdmpmh4LH6fN5umwVcRte-Up1rg4jz_oWY1DxZAI1Q5z_zKsIb01XWuoPNWZwe5bOE8RgzQ-1n0Cxm8xc48cp-P15vvUPxJk1j3E_8skJgNnN0QJQ4UDZlwIiaj5MF5By7Pge9mCwEHbUPsHR7NAsIGeNMc74he8Q'
                    const checkResponse = await axios.get(`https://5sim.net/v1/user/check/${id}`, {
                         headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                    });
                   if(checkResponse.data.status === 'CANCELED'){
                         console.log("Number cancelled")
                        return res.status(400).json({ message: 'Number cancelled' });
                   }
                   if (!checkResponse.data.sms || checkResponse.data.sms.length === 0) {
                        console.log("Waiting for OTP")
                        return res.status(200).json({ message: 'Waiting for OTP' });
                    }
                    const smsText = checkResponse.data.sms[checkResponse.data.sms.length-1].text
                     console.log("5sim otp request completed");
                     otp= smsText
                     await updateNumberHistory(userId,number,serviceName,serverNumber,price, otp,orderId);
                  await telegram.sendOtpNotification(user,serviceName,price, serverNumber,number,otp) //telegram notification
                   res.status(200).json({ otp });
                 break;
             case 3:
                console.log("smshub otp request started");
                response = await axios.get(`https://smshub.org/stubs/handler_api.php?api_key=${apiKeys.smshub}&action=getStatus&id=${id}`);
                if (response.data.includes('STATUS_CANCEL')) {
                        console.log("Number cancelled")
                    return res.status(400).json({ message: 'Number cancelled' });
                }
                  if (response.data.includes('STATUS_WAIT_CODE')) {
                         console.log("waiting for otp")
                        return res.status(200).json({ message: 'Waiting for OTP' });
                }
                  const [___, otp1] = response.data.split(':');
                     console.log("smshub otp request completed");
                    otp=otp1;
                     await updateNumberHistory(userId,number,serviceName,serverNumber,price, otp,orderId);
                     await telegram.sendOtpNotification(user,serviceName,price, serverNumber,number,otp) //telegram notification
                   res.status(200).json({ otp });
                break;
             case 4:
                  console.log("tigersms otp request started");
                response = await axios.get(`https://api.tiger-sms.com/stubs/handler_api.php?api_key=${apiKeys.tigersms}&action=getStatus&id=${id}`);
                 if (response.data.includes('ACCESS_CANCEL')) {
                         console.log("Number cancelled")
                     return res.status(400).json({ message: 'Number cancelled' });
                  }
                   if (response.data.includes('STATUS_WAIT_CODE')) {
                         console.log("waiting for otp")
                         return res.status(200).json({ message: 'Waiting for OTP' });
                  }
                const [____, otp2] = response.data.split(':');
                     console.log("tigersms otp request completed");
                    otp=otp2
                    await updateNumberHistory(userId,number,serviceName,serverNumber,price, otp,orderId);
                     await telegram.sendOtpNotification(user,serviceName,price, serverNumber,number,otp) //telegram notification
                res.status(200).json({ otp });
                break;
              case 5:
                    console.log("grizzlysms otp request started");
                response = await axios.get(`https://api.grizzlysms.com/stubs/handler_api.php?api_key=${apiKeys.grizzlysms}&action=getStatus&id=${id}`);
                if (response.data.includes('STATUS_CANCEL')) {
                        console.log("Number cancelled")
                    return res.status(400).json({ message: 'Number cancelled' });
                   }
                 if (response.data.includes('STATUS_WAIT_CODE')) {
                         console.log("waiting for otp")
                    return res.status(200).json({ message: 'Waiting for OTP' });
                 }
                 const [_____, otp3] = response.data.split(':');
                      console.log("grizzlysms otp request completed");
                   otp=otp3;
                  await updateNumberHistory(userId,number,serviceName,serverNumber,price, otp,orderId);
                    await telegram.sendOtpNotification(user,serviceName,price, serverNumber,number,otp) //telegram notification
                  res.status(200).json({ otp });
                break;
            case 6:
                  console.log("tempnum otp request started");
                response = await axios.get(`https://tempnum.org/stubs/handler_api.php?api_key=${apiKeys.tempnum}&action=getStatus&id=${id}`);
                if (response.data.includes('STATUS_CANCEL')) {
                        console.log("Number cancelled")
                    return res.status(400).json({ message: 'Number cancelled' });
                 }
                if (response.data.includes('STATUS_WAIT_CODE')) {
                        console.log("waiting for otp")
                    return res.status(200).json({ message: 'Waiting for OTP' });
                 }
                 const [______, ,otp4] = response.data.split(':');
                    console.log("tempnum otp request completed");
                  otp = otp4.split('is ')[1].split(' and is')[0]
                 await updateNumberHistory(userId,number,serviceName,serverNumber,price, otp,orderId);
                 await telegram.sendOtpNotification(user,serviceName,price, serverNumber,number,otp) //telegram notification
                   res.status(200).json({ otp });
                break;
            case 7:
                console.log("smsbower otp request started");
                response = await axios.get(`https://smsbower.online/stubs/handler_api.php?api_key=${apiKeys.smsbower}&action=getStatus&id=${id}`);
               if (response.data.includes('STATUS_CANCEL')) {
                        console.log("Number cancelled")
                    return res.status(400).json({ message: 'Number cancelled' });
                }
               if (response.data.includes('STATUS_WAIT_CODE')) {
                         console.log("waiting for otp")
                    return res.status(200).json({ message: 'Waiting for OTP' });
                }
                 const [_______, otp5] = response.data.split(':');
                     console.log("smsbower otp request completed");
                  otp= otp5;
                   await updateNumberHistory(userId,number,serviceName,serverNumber,price, otp,orderId);
                   await telegram.sendOtpNotification(user,serviceName,price, serverNumber,number,otp) //telegram notification
                  res.status(200).json({ otp });
                break;
            case 8:
                   console.log("smsactivate otp request started");
                 response = await axios.get(`https://api.sms-activate.io/stubs/handler_api.php?api_key=${apiKeys.smsactivate}&action=getStatus&id=${id}`);
                  if (response.data.includes('STATUS_CANCEL')) {
                        console.log("Number cancelled")
                    return res.status(400).json({ message: 'Number cancelled' });
                    }
                    if (response.data.includes('STATUS_WAIT_CODE')) {
                         console.log("waiting for otp")
                         return res.status(200).json({ message: 'Waiting for OTP' });
                    }
                  const [________, otp6] = response.data.split(':');
                   console.log("smsactivate otp request completed");
                   otp = otp6;
                  await updateNumberHistory(userId,number,serviceName,serverNumber,price, otp,orderId);
                     await telegram.sendOtpNotification(user,serviceName,price, serverNumber,number,otp) //telegram notification
                res.status(200).json({ otp });
                break;
            case 9:
                   console.log("ccpay otp request started");
                 const tokenResponse = await axios.get(`http://www.phantomunion.com:10023/pickCode-api/push/ticket?key=${apiKeys.ccpay}`);
                const token9 = tokenResponse.data.data.token;
                const sweetWrapperResponse =  await axios.get(`http://www.phantomunion.com:10023/pickCode-api/push/sweetWrapper?token=${token9}&serialNumber=${id}`)

               if(sweetWrapperResponse.data.code !== "200"){
                         console.log("Error while getting otp")
                        return res.status(400).json({ message: 'Error while getting otp' });
                   }
                    if(!sweetWrapperResponse.data.data.verificationCode[0].vc){
                         console.log("Waiting for otp")
                           return res.status(200).json({ message: 'Waiting for OTP' });
                     }

                     console.log("ccpay otp request completed");
                     otp = sweetWrapperResponse.data.data.verificationCode[0].vc;
                    await updateNumberHistory(userId,number,serviceName,serverNumber,price, otp,orderId);
                    await telegram.sendOtpNotification(user,serviceName,price, serverNumber,number,otp) //telegram notification
                     res.status(200).json({ otp });
                break;
             case 10:
                 console.log("smsactivationservice otp request started");
                response = await axios.get(`https://sms-activation-service.com/stubs/handler_api?api_key=${apiKeys.smsactivationservice}&action=getStatus&id=${id}`);
                  if (response.data.includes('STATUS_CANCEL')) {
                         console.log("Number cancelled")
                    return res.status(400).json({ message: 'Number cancelled' });
                     }
                    if (response.data.includes('STATUS_WAIT_CODE')) {
                          console.log("waiting for otp")
                        return res.status(200).json({ message: 'Waiting for OTP' });
                    }
                 const [_________, otp7] = response.data.split(':');
                      console.log("smsactivationservice otp request completed");
                     otp= otp7;
                  await updateNumberHistory(userId,number,serviceName,serverNumber,price, otp,orderId);
                 await telegram.sendOtpNotification(user,serviceName,price, serverNumber,number,otp) //telegram notification
                 res.status(200).json({ otp });
                break;
            case 11:
                 console.log("smsman otp request started");
                 const smsManResponse = await axios.get(`${smsManBaseUrl}/get-sms?token=${apiKeys.smsman}&request_id=${id}`);
                if (smsManResponse.data.error_code === "wrong_status") {
                         console.log("Number cancelled")
                    return res.status(400).json({ message: 'Number cancelled' });
                   }
                   
                 if (smsManResponse.data.error_code === "wait_sms") {
                       console.log("Waiting for OTP")
                       return res.status(200).json({ message: 'Waiting for OTP' });
                    }
                     console.log("smsman otp request completed");
                    otp = smsManResponse.data.sms_code;
                   await updateNumberHistory(userId,number,serviceName,serverNumber,price, otp,orderId);
                    await telegram.sendOtpNotification(user,serviceName,price, serverNumber,number,otp) //telegram notification
                   res.status(200).json({ otp });
                break;
            default:
                  console.log("Invalid server number")
                return res.status(400).json({ message: 'Invalid server number' });
        }
          console.timeEnd("getOtp")
    } catch (error) {
          console.timeEnd("getOtp")
        console.error('Error getting OTP:', error);
        res.status(500).json({ message: 'Error getting OTP', error: error.message });
    }
};


 const updateNumberHistory = async (userId, number, serviceName, server, price, otp,orderId) => {
    try {
         await NumberHistory.findOneAndUpdate({userId:userId, number:number, serviceName:serviceName, server:server,price:price, orderId:orderId},{otp:otp, status: 'Success'}, { new: true });
    }
    catch (error) {
       console.error('Error update number history:', error);
        throw error;
    }
}
export default getOtp;