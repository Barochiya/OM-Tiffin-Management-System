-- Run only in the dedicated analytics database as its least-privilege owner.
-- Never run this file against maapn1f6_omtiffin or another business database.
CREATE TABLE IF NOT EXISTS visitor_sessions (
  session_id VARCHAR(64) PRIMARY KEY,
  visitor_hash CHAR(64) NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  ip_cipher TEXT NOT NULL,
  customer_id CHAR(24) NULL,
  first_seen DATETIME(3) NOT NULL,
  last_activity DATETIME(3) NOT NULL,
  entry_page VARCHAR(500) NOT NULL,
  last_page VARCHAR(500) NOT NULL,
  user_agent VARCHAR(500) NOT NULL,
  device_category VARCHAR(20) NOT NULL,
  os_name VARCHAR(80) NOT NULL,
  browser_name VARCHAR(80) NOT NULL,
  browser_version VARCHAR(40) NOT NULL,
  screen_resolution VARCHAR(30) NOT NULL,
  viewport_resolution VARCHAR(30) NOT NULL,
  orientation VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Unknown',
  state VARCHAR(100) NOT NULL DEFAULT 'Unknown',
  city VARCHAR(100) NOT NULL DEFAULT 'Unknown',
  is_returning TINYINT(1) NOT NULL DEFAULT 0,
  INDEX visitor_last_activity (last_activity),
  INDEX visitor_first_seen (first_seen),
  INDEX visitor_hash_seen (visitor_hash, first_seen),
  INDEX visitor_ip_seen (ip_hash, first_seen),
  INDEX visitor_customer_seen (customer_id, first_seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visitor_pageviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  path VARCHAR(500) NOT NULL,
  visited_at DATETIME(3) NOT NULL,
  INDEX pageview_time (visited_at),
  INDEX pageview_path_time (path(191), visited_at),
  CONSTRAINT pageview_session FOREIGN KEY (session_id) REFERENCES visitor_sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
