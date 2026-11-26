import api from './api';
export const getDeliveryLocations = async () => (await api.get('/delivery-locations')).data;
export const saveDeliveryLocation = async (id, body) => (await api.put('/delivery-locations/' + id, body)).data;

export const getDeliveryLocation = async id => (await api.get('/delivery-locations/' + id)).data;
