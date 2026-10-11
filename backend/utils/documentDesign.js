const defaults = () => ({enabled:false,primary:'#1d4ed8',text:'#0f172a',font:'Helvetica',fontSize:10,logoPosition:'left',showLogo:true,layout:'modern',businessName:'OM TIFFIN SERVICE',tagline:'Healthy • Fresh • Homemade',contact:'+91 70162 97983',footer:'Thank you for choosing OM Tiffin Service.',terms:'Payment due within 7 days. Meals once delivered cannot be refunded.',showQr:true,upiId:'malaybarochiya-5@oksbi'});
const validate = value => {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid design settings');
 const result=defaults();
 for(const key of Object.keys(result)){
  if(value[key]===undefined)continue;
  const v=value[key];
  if(typeof result[key]==='boolean'){if(typeof v!=='boolean')throw Error('Invalid '+key);}
  else if(key==='fontSize'){if(!Number.isInteger(v)||v<9||v>13)throw Error('Font size must be 9–13');}
  else if(typeof v!=='string'||v.length>(['footer','terms'].includes(key)?500:120))throw Error('Invalid '+key);
  result[key]=v;
 }
 for(const key of ['primary','text'])if(!/^#[0-9a-f]{6}$/i.test(result[key]))throw Error('Invalid '+key+' color');
 if(!['Helvetica','Times-Roman','Courier'].includes(result.font))throw Error('Invalid font');
 if(!['left','center','right'].includes(result.logoPosition))throw Error('Invalid logo position');
 if(!['modern','classic'].includes(result.layout))throw Error('Invalid layout');
 return result;
};
const load = async type => {
 const Model=require('../models/DocumentDesign');
 const stored=await Model.findOne({key:'documents'}).lean();
 return {...defaults(),...(stored?.[type]||{})};
};
module.exports={defaults,validate,load};
