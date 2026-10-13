// Activate only during the final OM Tiffin snapshot; unset to resume rollback.
module.exports = function migrationPause(req, res, next) {
  if (process.env.OMTIFFIN_MIGRATION_PAUSED !== 'true') return next();
  res.setHeader('X-OM-Migration-State', 'source-paused');
  res.setHeader('X-OM-Revision', process.env.RENDER_GIT_COMMIT || 'unknown');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET' && req.path === '/') {
    return res.status(200).send('OM_TIFFIN_SOURCE_PAUSED');
  }
  res.setHeader('Retry-After', '120');
  return res.status(503).json({ message: 'OM Tiffin migration in progress. Please retry shortly.', code: 'OM_MIGRATION_PAUSED' });
};
