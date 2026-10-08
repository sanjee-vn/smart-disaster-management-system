import * as SecureStore from 'expo-secure-store';
const KEY = 'disaster-connect.session-token';
export const readSession = () => SecureStore.getItemAsync(KEY);
export const writeSession = token => SecureStore.setItemAsync(KEY, token);
export const deleteSession = () => SecureStore.deleteItemAsync(KEY);
