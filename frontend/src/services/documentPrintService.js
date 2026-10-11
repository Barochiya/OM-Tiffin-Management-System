import api from './api';
import {notify} from './notifications';

// Custom documents use the same canonical PDF as downloads and WhatsApp sends.
export async function printWithSavedDesign(type,id,legacyPrint){
  try {
    const {data}=await api.get('/document-design');
    if(!data.data[type].enabled){legacyPrint();return;}
    const response=await api.get(`/${type==='bill'?'bills':'payments'}/${id}/pdf`,{responseType:'blob'});
    const url=URL.createObjectURL(response.data),link=document.createElement('a');
    link.href=url;link.download=`OM-Tiffin-${type}-${id}.pdf`;
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    notify('Your custom PDF is ready. Open the downloaded PDF to print it.');
  }catch(error){notify(error.response?.data?.message||'Unable to prepare the document for printing.',{type:'error'});}
}
