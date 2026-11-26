# Visitor analytics isolation and activation gate

Visitor analytics is disabled unless `analytics.enabled` is explicitly true in the private BigRock `config.local.json`. The main OM Tiffin database is never used for analytics writes. Activation requires a separate database, a separate least-privilege database user, and the schema in `backend-bigrock/analytics-schema.sql` applied only to that database.

Required private configuration shape (replace every placeholder outside Git):

```json
{
  "analytics": {
    "enabled": false,
    "database": {
      "host": "localhost",
      "name": "SEPARATE_ANALYTICS_DATABASE",
      "user": "SEPARATE_ANALYTICS_USER",
      "password": "PRIVATE_PASSWORD"
    },
    "ipEncryptionKey": "PRIVATE_RANDOM_SECRET_AT_LEAST_32_CHARACTERS",
    "ipHashKey": "PRIVATE_RANDOM_SECRET_AT_LEAST_32_CHARACTERS",
    "visitorHashKey": "PRIVATE_RANDOM_SECRET_AT_LEAST_32_CHARACTERS",
    "trustedProxyCidrs": [],
    "fullIpAdminIds": [],
    "rateLimitPerMinute": 60,
    "retentionDays": 180
  }
}
```

Grant the analytics user only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on the two analytics tables after the schema has been installed. It must have no privileges on `maapn1f6_omtiffin`, and the business database user must have no privileges on the analytics database. Remove `CREATE`, `ALTER`, `DROP`, and `TRUNCATE` after setup.

Before enabling, verify database identity with the read-only health procedure, confirm the consent notice, configure only known BigRock reverse-proxy CIDRs, add explicit administrator IDs for full-IP search/export, and run synthetic tracking tests. If any check fails, leave `enabled` false. Analytics connection or write failure is intentionally swallowed by the tracking endpoint so normal application requests continue.

No IP geolocation service is configured. Country, state, and city therefore remain `Unknown`; the application does not invent location data or call a paid service.
