const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testBlog() {
  try {
    const login = await axios.post(`${API_URL}/auth/login`, {
      email: 'Rabins.admin@robin.com',
      password: 'Rabins@2026'
    });
    const token = login.data.data.accessToken;

    const res = await axios.post(`${API_URL}/web/blog`, {
      title: 'A Test Blog post',
      excerpt: 'Sample excerpt',
      content: 'Sample content',
      author: 'Tester',
      category: 'Wedding',
      published: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Error Status:", err.response?.status);
    console.log("Error Data:", err.response?.data);
  }
}
testBlog();
