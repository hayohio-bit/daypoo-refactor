const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api/v1';
const LOGIN_DATA = { email: 'user1@daypoo.com', password: '1234' };
const TOILET_ID = 38; // 오류시장
const LATITUDE = 37.49668;
const LONGITUDE = 126.84378;

async function runTests() {
  try {
    console.log('--- [1] Login Test ---');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, LOGIN_DATA);
    const token = loginRes.data.accessToken;
    console.log('✅ Login successful. Token obtained.');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n--- [2] Check-in Test ---');
    const checkInRes = await axios.post(`${BASE_URL}/records/check-in`, {
      toiletId: TOILET_ID,
      latitude: LATITUDE,
      longitude: LONGITUDE
    }, { headers });
    console.log('✅ Check-in successful at 오류시장.');
    console.log('Check-in Response:', JSON.stringify(checkInRes.data, null, 2));

    console.log('\n--- [3] AI Record Creation Test ---');
    const recordRes = await axios.post(`${BASE_URL}/records`, {
      toiletId: TOILET_ID,
      bristolScale: 4,
      color: 'Brown',
      conditionTags: ['쾌적함'],
      dietTags: ['고기'],
      latitude: LATITUDE,
      longitude: LONGITUDE,
      imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
    }, { headers });
    console.log('✅ Record creation processed.');
    console.log('Response:', JSON.stringify(recordRes.data, null, 2));

    console.log('\n--- [4] AI Health Report Test (DAILY - FREE) ---');
    const reportRes = await axios.get(`${BASE_URL}/reports/DAILY`, { headers });
    console.log('✅ Daily health report generated.');
    console.log('Response:', JSON.stringify(reportRes.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.error('❌ Error response:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error message:', error.message);
    }
  }
}

runTests();
