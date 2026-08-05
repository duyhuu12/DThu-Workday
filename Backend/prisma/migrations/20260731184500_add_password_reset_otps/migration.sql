CREATE TABLE `password_reset_otps` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `code_hash` CHAR(64) NOT NULL,
  `salt` VARCHAR(32) NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `send_count` INTEGER NOT NULL DEFAULT 1,
  `window_started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `last_sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` DATETIME(3) NOT NULL,
  `verified_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `password_reset_otps_user_id_key`(`user_id`),
  INDEX `password_reset_otps_expires_at_idx`(`expires_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `password_reset_otps_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
