ALTER TABLE `work_events`
  MODIFY `status` ENUM(
    'DRAFT',
    'PENDING',
    'APPROVED',
    'OPEN',
    'UPCOMING',
    'ONGOING',
    'COMPLETED',
    'REJECTED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'DRAFT';

UPDATE `work_events`
SET `status` = 'UPCOMING'
WHERE `status` IN ('APPROVED', 'OPEN')
  AND `registration_close` < CURRENT_TIMESTAMP();
