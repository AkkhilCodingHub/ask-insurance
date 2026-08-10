import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testDigilockerRc() {
  const regNo = 'HR01AU2800';
  const clientId = process.env.DIGILOCKER_CLIENT_ID || 'VAB517ADFA';
  const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET || '5a33098dd847c0efddcf';

  console.log('Testing vehicle lookup for:', regNo);
  console.log('Using DigiLocker Client ID:', clientId);

  // 1. Test DigiLocker pull certificate API format
  const pullEndpoints = [
    'https://api.digitallocker.gov.in/public/v1/pull/certificate',
    'https://partners.digitallocker.gov.in/public/v1/pull/certificate',
    'https://apisetu.gov.in/api/v1/transport/v2/vehicle/registration',
    'https://apisetu.gov.in/api/v1/morth/rc',
    'https://apisetu.gov.in/api/v1/transport/rc',
  ];

  const headersOptions = [
    {
      'X-APISETU-CLIENTID': clientId,
      'X-APISETU-APIKEY': clientSecret,
      'Content-Type': 'application/json',
    },
    {
      'Authorization': `Bearer ${clientSecret}`,
      'Content-Type': 'application/json',
    },
    {
      'client_id': clientId,
      'client_secret': clientSecret,
      'Content-Type': 'application/json',
    }
  ];

  const bodyOptions = [
    { regNo },
    { vehicleNo: regNo },
    { registrationNumber: regNo },
    {
      docType: 'VRGTR',
      orgId: 'in.gov.morth',
      parameters: { regNo }
    },
    {
      docType: 'RTOMC',
      orgId: 'in.gov.morth',
      parameters: { regNo }
    }
  ];

  for (const url of pullEndpoints) {
    for (const headers of headersOptions) {
      for (const body of bodyOptions) {
        try {
          const res = await axios.post(url, body, { headers, timeout: 4000 });
          if (res.data) {
            console.log('\n✅ SUCCESS FROM ENDPOINT:', url);
            console.log(JSON.stringify(res.data, null, 2));
            return;
          }
        } catch (err: any) {
          // ignore failures
        }
      }
    }
  }

  console.log('\nDigiLocker / APISetu endpoints returned no direct data for', regNo);
}

testDigilockerRc().catch(console.error);
