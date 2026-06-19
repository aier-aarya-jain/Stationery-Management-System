const axios = require('axios');

async function test() {
  try {
    // 1. login to get token
    const loginRes = await axios.post('http://localhost:8085/api/auth/login', {
      email: 'admin@school.edu',
      password: 'password'
    });
    const token = loginRes.data.token;
    console.log("Got token");

    // 2. add item
    const addRes = await axios.post('http://localhost:8085/api/inventory', {
      name: 'Test Pen',
      category: 'Writing',
      unit: 'Box',
      availableQuantity: 10,
      minimumQuantity: 5
    }, { headers: { Authorization: `Bearer ${token}` } });
    const id = addRes.data.id;
    console.log("Added item ID:", id);

    // 3. update item
    const updateRes = await axios.put(`http://localhost:8085/api/inventory/${id}`, {
      name: 'Test Pen Updated',
      category: 'Writing',
      unit: 'Box',
      availableQuantity: 15,
      minimumQuantity: 5
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log("Update success:", updateRes.data);

  } catch (e) {
    console.error("Error:", e.response ? e.response.data : e.message);
  }
}
test();
