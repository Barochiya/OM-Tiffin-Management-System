const dateKey = (value) => {
 const text=String(value||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text)||!Number.isFinite(new Date(text+'T00:00:00Z').getTime())||new Date(text+'T00:00:00Z').toISOString().slice(0,10)!==text) throw Object.assign(new Error('Use a valid YYYY-MM-DD date.'),{status:400});
 return text;
};
const missingMeals=(entry,records)=>['Lunch','Dinner'].filter(meal=>Number(entry[meal.toLowerCase()+'Qty']||0)>0&&!records.some(r=>r.meal===meal&&r.status==='Delivered'));
module.exports={dateKey,missingMeals};
