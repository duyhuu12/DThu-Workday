-- Add the class leader role while preserving existing users.
ALTER TABLE `users`
  MODIFY `role` ENUM('STUDENT', 'CLASS_LEADER', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN')
  NOT NULL DEFAULT 'STUDENT';

-- Assign a class to each class leader. Multiple class leaders may manage the same class.
ALTER TABLE `users`
  ADD COLUMN `managed_class_id` INTEGER NULL;

CREATE INDEX `users_managed_class_id_idx` ON `users`(`managed_class_id`);

ALTER TABLE `users`
  ADD CONSTRAINT `users_managed_class_id_fkey`
  FOREIGN KEY (`managed_class_id`) REFERENCES `classes`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Store preliminary review separately from the official registration status.
ALTER TABLE `registrations`
  ADD COLUMN `preliminary_status` ENUM('UNREVIEWED', 'CONFIRMED', 'NEEDS_REVIEW') NOT NULL DEFAULT 'UNREVIEWED',
  ADD COLUMN `preliminary_reviewed_at` DATETIME(3) NULL,
  ADD COLUMN `preliminary_reviewed_by_id` INTEGER NULL;

CREATE INDEX `registrations_preliminary_reviewed_by_id_idx`
  ON `registrations`(`preliminary_reviewed_by_id`);

ALTER TABLE `registrations`
  ADD CONSTRAINT `registrations_preliminary_reviewed_by_id_fkey`
  FOREIGN KEY (`preliminary_reviewed_by_id`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
