import axios from 'axios';

async function testPublicVahan() {
  const regNo = 'HR01AU2800';

  console.log('Testing public Vahan endpoints for:', regNo);

  const publicEndpoints = [
    `https://vahan-api.com/api/v1/rc/${regNo}`,
    `https://api.vahan.co.in/vehicle-details/${regNo}`,
    `https://rto-vehicle-information.p.rapidapi.com/rc/${regNo}`,
    `https://parivahan-api.herokuapp.com/vehicle/${regNo}`,
  ];

  for (const url of publicEndpoints) {
    try {
      console.log('Trying:', url);
      const res = await axios.get(url, { timeout: 3000 });
      if (res.data) {
        console.log('\n✅ FOUND REAL DATA FROM:', url);
        console.log(JSON.stringify(res.data, null, 2));
        return;
      }
    } catch (e: any) {
      console.log('Failed:', e.message);
    }
  }
}

testPublicVahan().catch(console.error);
