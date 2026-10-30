// const API_BASE_URL = 'http://localhost:5000/api';

// export async function request(endpoint, options = {}) {
//   const token = localStorage.getItem('token');
//   const headers = {
//     'Content-Type': 'application/json',
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     ...options.headers,
//   };

//   const response = await fetch(`${API_BASE_URL}${endpoint}`, {
//     ...options,
//     headers,
//   });

//   const data = await response.json().catch(() => ({}));

//   if (!response.ok) {
//     throw new Error(data.message || 'API request failed');
//   }

//   return data;
// }


const API_BASE_URL = 'https://todo-backend-2rz1.onrender.com/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}