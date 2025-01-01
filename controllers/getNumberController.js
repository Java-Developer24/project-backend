// getNumberController.js
import axios from 'axios';
import User from '../models/user.js';
import NumberHistory from '../models/history.js';
import userController from './userController.js';
import { v4 as uuidv4 } from 'uuid';
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

const getNumber = async (req, res) => {
  console.time("getNumber");
    const { userId, serviceName, serverNumber, serviceCode, otpType, price } = req.body; //Include userId here
    const orderId = uuidv4();
     try {
        const user = await User.findById(userId).lean();
        if (!user) {
             console.log("User not found")
            return res.status(404).json({ message: 'User not found' });
        }
       console.log("deducting user balance");
         await userController.deductUserBalance(userId, price);

       let response;

        switch (parseInt(serverNumber)) {
            case 1:
             console.log("fastsms request started");
                response = await axios.get(`https://fastsms.su/stubs/handler_api.php?api_key=${apiKeys.fastsms}&action=getNumber&service=${serviceCode}&country=22`);
                if (response.data.includes('NO_NUMBERS') || response.data.includes('NO_BALANCE')) {
                    console.log("No number found")
                        return res.status(400).json({ message: 'No numbers available' });
                     }
                const [_, id, number] = response.data.split(':');
                  console.log("fastsms request completed");
                 await saveNumber(userId, number, serviceName, serverNumber, price, orderId);
               await telegram.sendNumberNotification(user,serviceName,serviceCode,price, serverNumber,number) //telegram notification
                res.status(200).json({ id, number });
                break;
            case 2:
             console.log("5sim request started");
                  const token = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTU4NjQ1MDYsImlhdCI6MTcyNDMyODUwNiwicmF5IjoiOWMyYTg1NmM4ZjQ2YmNlZWFmZThjOWI4OTE1MTM4NWQiLCJzdWIiOjI2ODY5Nzl9.1EZHone0nsBX6gGlK6vS3sOPXj72-JYPyqLxPmd0F0OU4x5EbMwlUqVD7spF56Q2V_Xh1Db1H3wbgvlF2NmrSrJN-_Mp6D8yTmCWq7bCwm9aH6GmHVKnI1TtoK6b02dg5yNdmrnkuxnUbeSM7a9pBOMynZQJMbegF_0XPf0zLt0s62lhmrLKMGdmpmh4LH6fN5umwVcRte-Up1rg4jz_oWY1DxZAI1Q5z_zKsIb01XWuoPNWZwe5bOE8RgzQ-1n0Cxm8xc48cp-P15vvUPxJk1j3E_8skJgNnN0QJQ4UDZlwIiaj5MF5By7Pge9mCwEHbUPsHR7NAsIGeNMc74he8Q'
                  const buyResponse = await axios.get(`https://5sim.net/v1/user/buy/activation/india/any/${serviceCode}`, {
                        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                    });

                if(buyResponse.data.error === 'no free phones' || buyResponse.data.error === 'not enough user balance'){
                       console.log("No number found")
                        return res.status(400).json({ message: 'No numbers available' });
                }

                    console.log("5sim request completed");
                const { id, phone: number } = buyResponse.data;
                  await saveNumber(userId, number, serviceName, serverNumber, price, orderId);
                  await telegram.sendNumberNotification(user,serviceName,serviceCode,price, serverNumber,number) //telegram notification
                res.status(200).json({ id, number });
                break;
            case 3:
                 console.log("smshub request started");
                response = await axios.get(`https://smshub.org/stubs/handler_api.php?api_key=${apiKeys.smshub}&action=getNumber&service=${serviceCode}&operator=any&country=22`);
                if (response.data.includes('NO_NUMBERS') || response.data.includes('NO_BALANCE')) {
                         console.log("No number found")
                        return res.status(400).json({ message: 'No numbers available' });
                    }
                const [_, id, number1] = response.data.split(':');
                     console.log("smshub request completed");
                await saveNumber(userId, number1, serviceName, serverNumber, price, orderId);
                  await telegram.sendNumberNotification(user,serviceName,serviceCode,price, serverNumber,number1) //telegram notification
                res.status(200).json({ id, number: number1 });
                break;
            case 4:
                console.log("tigersms request started");
                 response = await axios.get(`https://api.tiger-sms.com/stubs/handler_api.php?api_key=${apiKeys.tigersms}&action=getNumber&service=${serviceCode}&country=22`);
                 if (response.data.includes('NO_NUMBERS') || response.data.includes('NO_BALANCE')) {
                         console.log("No number found")
                        return res.status(400).json({ message: 'No numbers available' });
                    }
                const [__, id1, number2] = response.data.split(':');
                  console.log("tigersms request completed");
               await saveNumber(userId, number2, serviceName, serverNumber, price, orderId);
                await telegram.sendNumberNotification(user,serviceName,serviceCode,price, serverNumber,number2) //telegram notification
                res.status(200).json({ id:id1, number: number2 });
                 break;
             case 5:
                    console.log("grizzlysms request started");
                 response = await axios.get(`https://api.grizzlysms.com/stubs/handler_api.php?api_key=${apiKeys.grizzlysms}&action=getNumber&service=${serviceCode}&country=22`);
                 if (response.data.includes('NO_NUMBERS') || response.data.includes('NO_BALANCE')) {
                         console.log("No number found")
                        return res.status(400).json({ message: 'No numbers available' });
                     }
                const [____, id2, number3] = response.data.split(':');
                 console.log("grizzlysms request completed");
                await saveNumber(userId, number3, serviceName, serverNumber, price, orderId);
                await telegram.sendNumberNotification(user,serviceName,serviceCode,price, serverNumber,number3) //telegram notification
                res.status(200).json({ id:id2, number: number3 });
                break;
            case 6:
                 console.log("tempnum request started");
                 response = await axios.get(`https://tempnum.org/stubs/handler_api.php?api_key=${apiKeys.tempnum}&action=getNumber&service=${serviceCode}&country=22`);
                 if (response.data.includes('NO_NUMBERS') || response.data.includes('NO_BALANCE')) {
                         console.log("No number found")
                        return res.status(400).json({ message: 'No numbers available' });
                    }
                const [_____, id3, number4] = response.data.split(':');
                     console.log("tempnum request completed");
                await saveNumber(userId, number4, serviceName, serverNumber, price, orderId);
                  await telegram.sendNumberNotification(user,serviceName,serviceCode,price, serverNumber,number4) //telegram notification
                res.status(200).json({id:id3, number: number4 });
                break;
            case 7:
                 console.log("smsbower request started");
                response = await axios.get(`https://smsbower.online/stubs/handler_api.php?api_key=${apiKeys.smsbower}&action=getNumber&service=${serviceCode}&country=22`);
                if (response.data.includes('NO_NUMBERS') || response.data.includes('NO_BALANCE')) {
                         console.log("No number found")
                        return res.status(400).json({ message: 'No numbers available' });
                    }
                 const [______, id4, number5] = response.data.split(':');
                     console.log("smsbower request completed");
                await saveNumber(userId, number5, serviceName, serverNumber, price, orderId);
                await telegram.sendNumberNotification(user,serviceName,serviceCode,price, serverNumber,number5) //telegram notification
                 res.status(200).json({id:id4, number: number5 });
                break;
            case 8:
                console.log("smsactivate request started");
                 response = await axios.get(`https://api.sms-activate.io/stubs/handler_api.php?api_key=${apiKeys.smsactivate}&action=getNumber&service=${serviceCode}&operator=any&country=22`);
                 if (response.data.includes('NO_NUMBERS') || response.data.includes('NO_BALANCE')) {
                         console.log("No number found")
                        return res.status(400).json({ message: 'No numbers available' });
                    }
                const [_______, id5, number6] = response.data.split(':');
                  console.log("smsactivate request completed");
                 await saveNumber(userId, number6, serviceName, serverNumber, price, orderId);
                   await telegram.sendNumberNotification(user,serviceName,serviceCode,price, serverNumber,number6) //telegram notification
                res.status(200).json({id:id5, number: number6 });
                break;
             case 9:
                 console.log("ccpay request started");
                 const tokenResponse = await axios.get(`http://www.phantomunion.com:10023/pickCode-api/push/ticket?key=${apiKeys.ccpay}`);
                const token9 = tokenResponse.data.data.token;
                const buyCandyResponse = await axios.get(`http://www.phantomunion.com:10023/pickCode-api/push/buyCandy?token=${token9}&businessCode=10643&quantity=1&country=IN&effectiveTime=10`)
                if(buyCandyResponse.data.code !=='200'){
                         console.log("No number found")
                         return res.status(400).json({ message: 'No numbers available' });
                }
                  console.log("ccpay request completed");
                    const {phoneNumber } = buyCandyResponse.data.data;
                const  {number:number7,serialNumber:id6} = phoneNumber[0];
                await saveNumber(userId, number7, serviceName, serverNumber, price, orderId);
                 await telegram.sendNumberNotification(user,serviceName,serviceCode,price, serverNumber,number7) //telegram notification
                res.status(200).json({id:id6, number: number7 });
                break;
             case 10:
                console.log("smsactivationservice request started");
                 response = await axios.get(`https://sms-activation-service.com/stubs/handler_api?api_key=${apiKeys.smsactivationservice}&action=getNumber&service=${serviceCode}&operator=any&country=22`);
                 if (response.data.includes('NO_NUMBERS') || response.data.includes('NO_BALANCE')) {
                         console.log("No number found")
                       return res.status(400).json({ message: 'No numbers available' });
                     }
                const [________, id7, number8] = response.data.split(':');
                 console.log("smsactivationservice request completed");
                 await saveNumber(userId, number8, serviceName, serverNumber, price, orderId);
                await telegram.sendNumberNotification(user,serviceName,serviceCode,price, serverNumber,number8) //telegram notification
                  res.status(200).json({ id:id7, number: number8 });
                break;
            case 11:
                  console.log("smsman request started");
                   const hasMultipleSms = otpType === 'Multiple Otp' || otpType === 'Single Otp';
                 const smsManResponse = await axios.get(`${smsManBaseUrl}/get-number?token=${apiKeys.smsman}&application_id=${serviceCode}&country_id=14&hasMultipleSms=${hasMultipleSms}`);
                   if(smsManResponse.data.error_code === "balance" || smsManResponse.data.error_code === "no_channels"){
                          console.log("No number found")
                            return res.status(400).json({ message: 'No numbers available' });
                        }
                      console.log("smsman request completed");
                     const { request_id, number: number9 } = smsManResponse.data;
                  await saveNumber(userId, number9, serviceName, serverNumber, price, orderId);
                   await telegram.sendNumberNotification(user,serviceName,serviceCode,price, serverNumber,number9) //telegram notification
                 res.status(200).json({ id:request_id, number: number9 });
                    break;
            default:
               console.log("Invalid server number")
                return res.status(400).json({ message: 'Invalid server number' });
        }
     console.timeEnd("getNumber");
    } catch (error) {
        console.error('Error getting number:', error);
        res.status(500).json({ message: 'Error getting number', error: error.message });
    }
};

const saveNumber = async (userId, number, serviceName, serverNumber, price, orderId) => {
      try {
        const newNumberHistory = new NumberHistory({
            userId,
            number,
            serviceName,
            server,
            price,
             orderId
        });
        await newNumberHistory.save();

    } catch (error) {
        console.error('Error saving number history:', error);
        throw error
    }
};


export default getNumber;



