export const contactKey = (message) => {
  const digits = String(message.phoneNumber || '').replace(/\D/g, '').replace(/^00/, '');
  return digits ? (digits.length === 10 ? '91' + digits : digits) : 'unknown-' + (message.customer?._id || message._id);
};
export const messageTime = (message) => new Date(message.whatsappTimestamp || message.createdAt || 0).getTime() || 0;
export function groupConversations(messages) {
  const groups = new Map();
  for (const message of messages) {
    const key = contactKey(message);
    if (!groups.has(key)) groups.set(key, {key, name: '', phone: message.phoneNumber || '', messages: [], unread: 0});
    const group = groups.get(key);
    group.messages.push(message);
    if (message.customer?.customerName) group.name = message.customer.customerName;
    if (message.direction !== 'outgoing' && message.inboxStatus === 'unread') group.unread++;
  }
  return [...groups.values()].map(group => {
    group.messages.sort((a,b)=>messageTime(a)-messageTime(b) || String(a._id).localeCompare(String(b._id)));
    return {...group, name: group.name || group.phone || 'Unknown contact', latest: group.messages.at(-1)};
  }).sort((a,b)=>messageTime(b.latest)-messageTime(a.latest));
}
export function searchConversations(conversations, query) {
  const text = query.trim().toLocaleLowerCase(), digits = text.replace(/\D/g,'');
  if (!text) return conversations;
  return conversations.filter(group => [group.name, group.phone, ...group.messages.map(message=>message.message || message.mediaCaption || message.mediaFilename || '')].some(value=>String(value).toLocaleLowerCase().includes(text)) || (digits && /^[+\d\s()-]+$/.test(text) && group.key.includes(digits)));
}
