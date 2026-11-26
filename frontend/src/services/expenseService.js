import api from './api';
export const getExpenseReport = async (filters = {}) => (await api.get('/expenses', {params:filters})).data;
export const saveExpense = async (body, id = null) => (await (id ? api.put('/expenses/'+id,body) : api.post('/expenses',body))).data;
export const cancelExpense = async (id, body) => (await api.post('/expenses/'+id+'/cancel',body)).data;
