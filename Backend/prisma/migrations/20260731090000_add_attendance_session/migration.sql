ALTER TABLE `work_events`
  ADD COLUMN `attendance_session_active` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `attendance_session_mode` VARCHAR(20) NULL,
  ADD COLUMN `attendance_session_nonce` VARCHAR(64) NULL,
  ADD COLUMN `attendance_session_started_at` DATETIME(3) NULL,
  ADD COLUMN `attendance_session_ended_at` DATETIME(3) NULL;
