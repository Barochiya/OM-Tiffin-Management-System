# OM Tiffin BigRock deployment

Production domain: `omtiffinservices.com`. Existing shared plan; separate addon domain, public paths, private paths and MySQL database. Never use or alter Hemadri resources.

The website, customer dashboard and native admin WebView use `https://www.omtiffinservices.com/api`. PHP authenticates existing administrator/customer identities against `maapn1f6_omtiffin`. Node CLI is a private PDF rendering utility only.

Each push to `main` runs tests, builds the frontend and original PDF utilities, then publishes an immutable `bigrock-<commit>` code release. The BigRock puller checks the archive checksum, project identity, safe paths, PHP syntax and dedicated database connectivity before switching the website symlink. Keep the previous release for rollback. The puller is inactive without the private `deploy.enabled` marker.

Release artifacts contain only `web/`, `php/`, `render/` and a manifest. They never contain SQL imports, BSON, database exports, configuration secrets, customer uploads or backups. Code deployment never runs database imports or migrations. Runtime configuration remains `/home1/maapn1f6/omtiffin-private/private/config.local.json`; uploads remain its sibling `uploads/` directory. `OMTIFFIN_CONFIG` and `OMTIFFIN_UPLOADS` can explicitly select these private runtime paths.

Before first activation, finish HTTP/browser/mobile verification, configure HTTPS, recover historical attachments where available, reconcile a final quiesced source backup, and verify the rollback. Disable old Vercel/Render automatic Git deployment before pushing the new production configuration. Preserve the old services for rollback. Do not enable writes or external notification workers until cutover gates pass; provider sends require approval during migration.

The public document root will point to `/home1/maapn1f6/omtiffinservices.com/current`; release frontend files are separate from the private PHP/PDF release code. `apiEnabled`, `writesEnabled`, `workersEnabled` and `externalMessagesEnabled` in private migration configuration independently guard activation. Existing data/config are never replaced by a Git push.

`deploy.py` and the workflow are prepared code. Their presence does not confirm that a production deployment, cron, DNS change, backup schedule or end-to-end verification has been completed.
