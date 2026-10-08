import { notify, confirmAction } from "../services/notifications";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Inbox, RefreshCw, Search, ArrowLeft, Send, Trash2, Paperclip, Check, MessageSquare } from "lucide-react";
import { getWhatsAppInbox, deleteWhatsAppMessage, markWhatsAppMessageRead, getWhatsAppMedia, replyToWhatsAppMessage } from "../services/whatsappInboxService";
import { groupConversations, searchConversations, messageTime } from "../utils/whatsappConversations";
import "../styles/whatsapp-inbox.css";
const WhatsAppMediaPreview = ({ message }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFullImage, setShowFullImage] = useState(false);



  useEffect(() => {
    let objectUrl = null;

    const loadMedia = async () => {
      try {
        setLoading(true);
        setError("");

        const blob =
          await getWhatsAppMedia(message._id);

        objectUrl =
          URL.createObjectURL(blob);

        setUrl(objectUrl);
      } catch (err) {
        console.error(
          "WhatsApp Media Preview Error:",
          err
        );

        setError(
          "Unable to load image."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMedia();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [message._id]);

  if (loading) {
    return (
      <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-700">
        <Image className="inline-block mr-2" size={18} />Loading image...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 font-semibold text-slate-700">
        <Image className="inline-block mr-2" size={18} />WhatsApp Image
      </p>

      <div
  onClick={() =>
    setShowFullImage(true)
  }
  className="inline-block cursor-pointer"
>
  <img
    src={url}
    alt={
      message.mediaCaption ||
      "WhatsApp image"
    }
    className="max-h-[500px] w-auto max-w-full rounded-lg border shadow-sm transition hover:opacity-90"
  />
</div>

  {showFullImage && (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
      onClick={() =>
        setShowFullImage(false)
      }
    >
      <button
        type="button"
        onClick={() =>
          setShowFullImage(false)
        }
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl font-bold text-slate-800 shadow-lg hover:bg-slate-200"
        aria-label="Close image"
      >
        ✕
      </button>

      <img
        src={url}
        alt={
          message.mediaCaption ||
          "WhatsApp image"
        }
        className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      />
    </div>
  )}


      {message.mediaCaption && (
        <p className="mt-3 text-sm text-slate-600">
          {message.mediaCaption}
        </p>
      )}
    </div>
  );
};

export default function WhatsAppInbox() {
  const [messages, setMessages] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [search, setSearch] = useState(''), [selectedKey, setSelectedKey] = useState(null);
  const [drafts, setDrafts] = useState({}), [sending, setSending] = useState({});
  const pendingSends = useRef(new Set()), requestVersion = useRef(0), thread = useRef(null);
  const followMessages = useRef(true), lastChat = useRef(null);
  const conversations = useMemo(()=>groupConversations(messages),[messages]);
  const filtered = useMemo(()=>searchConversations(conversations,search),[conversations,search]);
  const selected = conversations.find(group=>group.key===selectedKey);
  const replyAnchor = selected?.messages.filter(message=>message.direction!=='outgoing').at(-1) || selected?.latest;
  const time = message => messageTime(message) ? new Date(messageTime(message)).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '';
  const day = message => messageTime(message) ? new Date(messageTime(message)).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : 'Date unavailable';
  async function loadMessages(initial=false) {
    const version=++requestVersion.current;
    if(initial)setLoading(true);
    try {const response=await getWhatsAppInbox();if(version===requestVersion.current){setMessages(Array.isArray(response?.data)?response.data:[]);setError('');}}
    catch(err){if(version===requestVersion.current)setError(err.response?.data?.message || 'Unable to refresh messages. Please retry.');}
    finally{if(version===requestVersion.current)setLoading(false);}
  }
  useEffect(()=>{loadMessages(true);const timer=setInterval(()=>loadMessages(),10000);return ()=>{clearInterval(timer);requestVersion.current++;};},[]);
  useEffect(()=>{if(thread.current && (followMessages.current || lastChat.current!==selectedKey))thread.current.scrollTop=thread.current.scrollHeight;lastChat.current=selectedKey;},[selectedKey,selected?.messages.length]);
  async function removeMessage(id) {
    if(!await confirmAction('Delete this WhatsApp message?'))return;
    try{await deleteWhatsAppMessage(id);setMessages(current=>current.filter(message=>message._id!==id));}
    catch(err){notify(err.response?.data?.message || 'Unable to delete message.');}
  }
  async function readMessage(id) {
    try{await markWhatsAppMessageRead(id);setMessages(current=>current.map(message=>message._id===id?{...message,inboxStatus:'read'}:message));}
    catch(err){notify(err.response?.data?.message || 'Unable to mark message as read.');}
  }
  async function sendReply(event) {
    event.preventDefault();
    const key=selectedKey, text=drafts[key]?.trim(), anchor=replyAnchor;
    if(!text || !anchor || pendingSends.current.has(key))return;
    pendingSends.current.add(key);setSending(current=>({...current,[key]:true}));
    try{
      const response=await replyToWhatsAppMessage(anchor._id,text);
      if(!response?.success)throw Error(response?.message || 'Unable to send reply.');
      setDrafts(current=>current[key]?.trim()===text?{...current,[key]:''}:current);
      const reply=response.data?.reply;
      if(reply?._id)setMessages(current=>[...current.filter(message=>message._id!==reply._id).map(message=>message._id===anchor._id?{...message,inboxStatus:'read'}:message),{...reply,customer:reply.customer?.customerName?reply.customer:anchor.customer}]);
      await loadMessages();notify('WhatsApp reply sent successfully.',{type:'success'});
    }catch(err){notify(err.response?.data?.message || err.message || 'Unable to send reply.');}
    finally{pendingSends.current.delete(key);setSending(current=>({...current,[key]:false}));}
  }
  return <div className="wa-workspace">
    <div className="wa-title"><div><h1><MessageSquare size={24}/> WhatsApp Inbox</h1><p>Conversations, replies and payment screenshots</p></div><button type="button" onClick={()=>loadMessages()} aria-label="Refresh conversations"><RefreshCw size={18}/> Refresh</button></div>
    {error && <div role="alert" className="wa-error">{error} <button type="button" onClick={()=>loadMessages()}>Retry</button></div>}
    <div className={'wa-shell '+(selected?'wa-chat-open':'')}>
      <section className="wa-contacts" aria-label="Conversations"><div className="wa-contacts-heading"><strong>Chats</strong><span>{conversations.length}</span></div>
        <label className="wa-search"><Search size={17}/><input aria-label="Search conversations" placeholder="Search name, phone or messages" value={search} onChange={event=>setSearch(event.target.value)}/></label>
        <div className="wa-contact-list">{loading?<p role="status" className="wa-empty">Loading conversations…</p>:filtered.length===0?<p className="wa-empty">{search?'No matching conversations':'No messages yet'}</p>:filtered.map(group=><button key={group.key} type="button" className={'wa-contact '+(group.key===selectedKey?'wa-selected':'')} onClick={()=>setSelectedKey(group.key)} aria-pressed={group.key===selectedKey}>
          <span className="wa-avatar">{group.name.slice(0,1).toUpperCase()}</span><span className="wa-contact-info"><span className="wa-contact-top"><strong>{group.name}</strong><time>{time(group.latest)}</time></span><span className="wa-contact-phone">{group.phone}</span><span className="wa-contact-preview">{group.latest.direction==='outgoing'?'You: ':''}{group.latest.message || group.latest.mediaCaption || group.latest.mediaFilename || group.latest.type || 'Message'}</span></span>{group.unread>0&&<span className="wa-unread" aria-label={group.unread+' unread messages'}>{group.unread}</span>}
        </button>)}</div>
      </section>
      <section className="wa-chat" aria-label="Selected conversation">{!selected?<div className="wa-welcome"><span><Inbox size={44}/></span><h2>Your conversations, together</h2><p>Select a person to view their message history and reply.</p></div>:<>
        <div className="wa-chat-header"><button type="button" className="wa-back" aria-label="Back to conversations" onClick={()=>setSelectedKey(null)}><ArrowLeft size={20}/></button><span className="wa-avatar">{selected.name.slice(0,1).toUpperCase()}</span><div><strong>{selected.name}</strong><p>{selected.phone} · {selected.messages.length} messages</p></div></div>
        <div className="wa-thread" ref={thread} onScroll={event=>{const node=event.currentTarget;followMessages.current=node.scrollHeight-node.scrollTop-node.clientHeight<80;}}>{selected.messages.map((message,index)=><div key={message._id}>
          {(index===0 || day(message)!==day(selected.messages[index-1]))&&<div className="wa-day">{day(message)}</div>}
          <article className={'wa-bubble '+(message.direction==='outgoing'?'wa-outgoing':'wa-incoming')}><p className="wa-message-text">{message.message || (!message.mediaId?message.type:'')}</p>
            {message.mediaId&&(message.type==='image'?<WhatsAppMediaPreview message={message}/>:<div className="wa-attachment"><Paperclip size={18}/><span>{message.mediaFilename || message.type}{message.mediaCaption&&<p>{message.mediaCaption}</p>}</span></div>)}
            {message.paymentStatus==='pending_review'&&<span className="wa-review">Payment review pending</span>}
            <div className="wa-message-footer"><time>{time(message)}</time>{message.direction==='outgoing'&&<span>Sent</span>}
              {message.direction!=='outgoing'&&message.inboxStatus==='unread'&&<button type="button" onClick={()=>readMessage(message._id)} aria-label={'Mark message '+message._id+' as read'}><Check size={14}/> Read</button>}
              <button type="button" onClick={()=>removeMessage(message._id)} aria-label={'Delete message '+message._id}><Trash2 size={14}/></button></div>
          </article></div>)}</div>
        <form className="wa-composer" onSubmit={sendReply}><textarea aria-label="Reply message" placeholder="Type a reply…" value={drafts[selected.key] || ''} rows={2} onChange={event=>setDrafts(current=>({...current,[selected.key]:event.target.value}))} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();sendReply(event);}}}/><button type="submit" disabled={sending[selected.key] || !drafts[selected.key]?.trim()} aria-label="Send reply"><Send size={18}/><span>{sending[selected.key]?'Sending…':'Send'}</span></button></form>
      </>}</section>
    </div>
  </div>;
}
