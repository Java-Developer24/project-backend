import axios from "axios"



// Define functions to fetch balances for each server
const getServer1Balance = async () => {
  const response = await axios.get(
    'https://fastsms.su/stubs/handler_api.php?api_key=cfb7e4c410ef1b96da87cf72fa11189badd&action=getBalance'
  );
  const parts = response.data.split(":");
  return { balance: parseFloat(parts[1]), currency: 'p' };
};

const getServer2Balance = async () => {
    const response = await axios.get('https://5sim.net/v1/user/profile', {
      headers: {
        Authorization: `Bearer eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjcyMDUyNzgsImlhdCI6MTczNTY2OTI3OCwicmF5IjoiOWMyYTg1NmM4ZjQ2YmNlZWFmZThjOWI4OTE1MTM4NWQiLCJzdWIiOjI2ODY5Nzl9.tizb0wZwREa_x1e345Q7qjLZ3gqGFzQjwjOyREgyTrWigcJ7UQNZA6NWMbIHl3yDxTnb0gYtzqpezl7XJ35MV6c8om1PfAGXmCqyvoLAGtwleUBJ65e1zQ8XWzBF2WkwdDK7GIOZhdDn38myywyjkUuiQJgV_zJ9EpDOMf11WMcRQHvpFvy0JWwsMxy-fcY6u8bbtvxDkPM21N9iAlSXbME84bjoAtR-I94WD7ztUyCprZzeAeB87A8lyC1ncvkLRyfKFgcx8WBQEJi4nrIo-iATw93oNU3Le-Gt_FlVcISPFyNHo4G-4bC4EXfJy0xRgMtHD22JfGOj0Yppy7RjpQ`,
        Accept: "application/json",
      },
    });
  return { balance: parseFloat(response.data.balance), currency: 'p' };
};

// Add similar functions for other servers...
const getServer3Balance = async () => {
  const response = await axios.get(
    'https://smshub.org/stubs/handler_api.php?api_key=224356U85b8978f6a47faab51436b821be07584&action=getBalance'
  );
  
  const parts = response.data.split(":");
  
  return { balance:  parseFloat(parts[1]) , currency: '$' };
};
// Add similar functions for other servers...

  // Add similar functions for other servers...
const getServer4Balance = async () => {
    const response = await axios.get(
      'https://api.grizzlysms.com/stubs/handler_api.php?api_key=937c498d19cabb18cfa63659a45301a0&action=getBalance'
    );
    const parts = response.data.split(":");
    return { balance: parseFloat(parts[1]), currency: 'p' };
  };
  // Add similar functions for other servers...
const getServer5Balance = async () => {
    const response = await axios.get(
      'https://tempnum.org/stubs/handler_api.php?api_key=7a4936c941ed582380d5063ff8d0dad8&action=getBalance '
    );
    const parts = response.data.split(":");
    return { balance: parseFloat(parts[1]), currency: 'p' };
  };
  // Add similar functions for other servers...
const getServer8Balance = async () => {
    const response = await axios.get(
      'https://smsbower.online/stubs/handler_api.php?api_key=22vgH70wFS4eLr2C6wv0tct8BPzeJpzE&action=getBalance'
    );
    const parts = response.data.split(":");
    return { balance: parseFloat(parts[1]), currency: 'p' };
  };
  // Add similar functions for other servers...
const getServer6Balance = async () => {
    const response = await axios.get(
      'https://api.sms-activate.guru/stubs/handler_api.php?api_key=A5e72d2bd426A1b93989Ac9456d83127&action=getBalance'
    );
    const parts = response.data.split(":");
    return { balance: parseFloat(parts[1]), currency: 'p' };
  };
  // Add similar functions for other servers...
const getServer7Balance = async () => {
    const response = await axios.get(
      'https://own5k.in/p/ccpay.php?type=balance'
    );
    return { balance: parseFloat(response.data), currency: '$' };
  };
  // Add similar functions for other servers...


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

