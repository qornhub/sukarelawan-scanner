// app/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

//export const API_BASE = 'http://192.168.1.20/1fyp/fyp/public'; // <- use your LAN IP or ngrok URL
//export const API_BASE = 'http://sukarela.local';
// app/api.ts
export const API_BASE = 'http://192.168.1.20'; // <-- use just the host (or http://sukarela.local if your device resolves it)
const api = axios.create({
  baseURL: API_BASE + '/api', // => requests go to http://192.168.1.20/api/...
  headers: { 'Content-Type': 'application/json' },
});

export async function setTokenAndUser(token: string, user: any) {
  await SecureStore.setItemAsync('userToken', token);
  await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export async function removeTokenAndUser() {
  await SecureStore.deleteItemAsync('userToken');
  await SecureStore.deleteItemAsync('userInfo');
  delete api.defaults.headers.common['Authorization'];
}

export async function loadTokenAndUser() {
  const token = await SecureStore.getItemAsync('userToken');
  const userStr = await SecureStore.getItemAsync('userInfo');
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  const user = userStr ? JSON.parse(userStr) : null;
  return { token, user };
}

export default api;
