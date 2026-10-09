import * as SecureStore from 'expo-secure-store';
// v2 invalidates tokens saved before the Staff operational-updates API was integrated.
const KEY = 'disaster-connect.session-token.v2';
export const readSession = () => SecureStore.getItemAsync(KEY);
export const writeSession = token => SecureStore.setItemAsync(KEY, token);
export const deleteSession = () => SecureStore.deleteItemAsync(KEY);
