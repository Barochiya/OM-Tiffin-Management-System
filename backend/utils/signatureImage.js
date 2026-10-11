const PDFDocument=require('pdfkit'),zlib=require('zlib');
const decode=value=>Buffer.from(value.slice(value.indexOf(',')+1),'base64');
function validate(value){
 if(value==='')return;
 if(typeof value!=='string'||value.length>350000||!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value))throw Error('Invalid signature image. Use PNG or JPG up to 256 KB.');
 const bytes=decode(value);if(bytes.length>256*1024)throw Error('Invalid signature image size');
 if(value.startsWith('data:image/png')?!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes[0]!==255||bytes[1]!==216)throw Error('Invalid signature image format');
 let doc;
 try{
  doc=new PDFDocument();const image=doc.openImage(bytes);
  if(!image.width||!image.height||image.width>2048||image.height>2048)throw Error('size');
  if(image.imgData)zlib.inflateSync(image.imgData,{maxOutputLength:40*1024*1024});
 }catch{throw Error('Invalid signature image. Use a valid PNG or JPG no larger than 2048 × 2048 pixels.');}
 finally{if(doc)doc.destroy();}
}
module.exports={validate,decode};
