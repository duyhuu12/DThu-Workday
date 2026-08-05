UPDATE `registrations`
SET
  `status` = 'APPROVED',
  `approved_at` = COALESCE(`approved_at`, CURRENT_TIMESTAMP(3))
WHERE `status` = 'PENDING';

INSERT INTO `attendances` (
  `event_id`,
  `student_id`,
  `status`,
  `updated_at`
)
SELECT
  r.`event_id`,
  r.`student_id`,
  'NOT_CHECKED',
  CURRENT_TIMESTAMP(3)
FROM `registrations` r
LEFT JOIN `attendances` a
  ON a.`event_id` = r.`event_id`
  AND a.`student_id` = r.`student_id`
WHERE r.`status` = 'APPROVED'
  AND a.`id` IS NULL;
