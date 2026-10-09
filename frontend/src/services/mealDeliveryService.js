import api from './api';
export const getDeliveries=async(date,customer)=> (await api.get('/meal-deliveries',{params:{date,customer}})).data;
export const markDelivery=async(payload)=>(await api.post('/meal-deliveries',payload)).data;
export const currentDeliveryMeal=(now=new Date())=>Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',hourCycle:'h23'}).format(now))>=17?'Dinner':'Lunch';
