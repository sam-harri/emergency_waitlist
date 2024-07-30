import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://emergencyserver-51eb250eec5a.herokuapp.com/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;