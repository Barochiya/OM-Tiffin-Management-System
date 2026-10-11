// Preview, downloads and WhatsApp use the same document renderers.
module.exports = async (type, data, customer, design) => {
 if (type === 'receipt') return require('./receiptCardPdf')(data, customer, design);
 // Passing design explicitly prevents reloading settings or recursing here.
 if (type === 'bill') return require('./billPdfGenerator')(data, customer, design);
 throw new Error('Invalid document type');
};
