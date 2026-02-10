-- T2.6.2 - Make daily_records track-aware
-- Safe for both clean and non-empty environments.

ALTER TABLE daily_records
ADD COLUMN IF NOT EXISTS track_id text;

UPDATE daily_records
SET track_id = 'TYT'
WHERE track_id IS NULL;

ALTER TABLE daily_records
ALTER COLUMN track_id SET NOT NULL;

ALTER TABLE daily_records
DROP CONSTRAINT IF EXISTS daily_records_user_id_date_key;

ALTER TABLE daily_records
ADD CONSTRAINT daily_records_user_track_date_key
UNIQUE (user_id, track_id, date);
