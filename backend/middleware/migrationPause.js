// Activate only during the final OM Tiffin snapshot; unset to resume rollback.
module.exports = async function migrationPause(req, res, next) {
  if (process.env.OMTIFFIN_MIGRATION_PAUSED !== 'true') return next();
  res.setHeader('X-OM-Migration-State', 'source-paused');
  res.setHeader('X-OM-Revision', process.env.RENDER_GIT_COMMIT || 'unknown');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET' && req.path === '/') {
    return res.status(200).send('OM_TIFFIN_SOURCE_PAUSED');
  }
  // Temporary compatibility for clients retaining the old frontend after DNS
  // cutover. Never execute an old Mongo route or accept a configurable target.
  if (process.env.OMTIFFIN_MIGRATION_PROXY === 'true' &&
      /^\/api(?:\/|\?|$)/.test(req.originalUrl) &&
      ['GET','HEAD','POST','PUT','PATCH','DELETE'].includes(req.method)) {
    try {
      const headers={};
      for(const key of ['authorization','content-type','accept','origin','x-hub-signature-256','x-idempotency-key','idempotency-key','x-whatsapp-send-secret']) {
        if(typeof req.headers[key]==='string')headers[key]=req.headers[key];
      }
      const options={method:req.method,headers,redirect:'error',signal:AbortSignal.timeout(60000)};
      if(!['GET','HEAD'].includes(req.method)){options.body=req;options.duplex='half';}
      const response=await fetch('https://www.omtiffinservices.com'+req.originalUrl,options);
      for(const key of ['content-type','content-disposition','cache-control','retry-after']) {
        const value=response.headers.get(key);if(value)res.setHeader(key,value);
      }
      res.setHeader('X-OM-Migration-State','bigrock-compatibility-forward');
      return res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
    } catch {
      return res.status(502).json({message:'OM Tiffin connection interrupted. Please refresh before retrying.'});
    }
  }
  res.setHeader('Retry-After', '120');
  return res.status(503).json({ message: 'OM Tiffin migration in progress. Please retry shortly.', code: 'OM_MIGRATION_PAUSED' });
};
