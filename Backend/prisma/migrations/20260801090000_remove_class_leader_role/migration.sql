-- Preserve student accounts before removing the obsolete role.
UPDATE `users`
SET `role` = 'STUDENT', `managed_class_id` = NULL
WHERE `role` = 'CLASS_LEADER';

ALTER TABLE `registrations`
  DROP FOREIGN KEY `registrations_preliminary_reviewed_by_id_fkey`;

ALTER TABLE `registrations`
  DROP INDEX `registrations_preliminary_reviewed_by_id_idx`,
  DROP COLUMN `preliminary_status`,
  DROP COLUMN `preliminary_reviewed_at`,
  DROP COLUMN `preliminary_reviewed_by_id`;

ALTER TABLE `users`
  DROP FOREIGN KEY `users_managed_class_id_fkey`;

ALTER TABLE `users`
  DROP INDEX `users_managed_class_id_idx`,
  DROP COLUMN `managed_class_id`;

ALTER TABLE `users`
  MODIFY `role` ENUM('STUDENT', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN')
  NOT NULL DEFAULT 'STUDENT';
