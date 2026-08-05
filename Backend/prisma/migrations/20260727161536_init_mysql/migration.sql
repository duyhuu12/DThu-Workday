-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `role` ENUM('STUDENT', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'STUDENT',
    `status` ENUM('ACTIVE', 'LOCKED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `phone` VARCHAR(20) NULL,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faculties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `faculties_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `faculty_id` INTEGER NOT NULL,
    `school_year` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `classes_code_key`(`code`),
    INDEX `classes_faculty_id_idx`(`faculty_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `student_code` VARCHAR(50) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `faculty_id` INTEGER NOT NULL,
    `class_id` INTEGER NOT NULL,
    `school_year` VARCHAR(20) NOT NULL,
    `gender` VARCHAR(10) NOT NULL,
    `birth_date` DATETIME(3) NULL,
    `hometown` VARCHAR(150) NULL,
    `status` ENUM('ACTIVE', 'LOCKED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `required_workdays` INTEGER NOT NULL DEFAULT 12,
    `accumulated_workdays` DOUBLE NOT NULL DEFAULT 0.0,
    `completed_workdays` DOUBLE NOT NULL DEFAULT 0.0,

    UNIQUE INDEX `students_user_id_key`(`user_id`),
    UNIQUE INDEX `students_student_code_key`(`student_code`),
    UNIQUE INDEX `students_email_key`(`email`),
    INDEX `students_class_id_idx`(`class_id`),
    INDEX `students_faculty_id_idx`(`faculty_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `work_content` TEXT NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    `start_time` VARCHAR(10) NOT NULL,
    `end_time` VARCHAR(10) NOT NULL,
    `shift` ENUM('MORNING', 'AFTERNOON', 'EVENING', 'FULLDAY') NOT NULL DEFAULT 'MORNING',
    `registration_open` DATETIME(3) NOT NULL,
    `registration_close` DATETIME(3) NOT NULL,
    `cancellation_deadline` DATETIME(3) NOT NULL,
    `max_capacity` INTEGER NOT NULL,
    `registered_count` INTEGER NOT NULL DEFAULT 0,
    `workday_credit` DOUBLE NOT NULL DEFAULT 1.0,
    `clothing_requirements` TEXT NULL,
    `equipment_requirements` TEXT NULL,
    `contact_person` VARCHAR(100) NOT NULL,
    `contact_phone` VARCHAR(20) NOT NULL,
    `organizer_id` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'PENDING', 'APPROVED', 'OPEN', 'ONGOING', 'COMPLETED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `eligible_faculty_ids` TEXT NULL,
    `eligible_class_ids` TEXT NULL,
    `eligible_school_years` TEXT NULL,

    UNIQUE INDEX `work_events_code_key`(`code`),
    INDEX `work_events_organizer_id_idx`(`organizer_id`),
    INDEX `work_events_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registrations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'WAITLIST', 'COMPLETED', 'CANCELLED', 'ABSENT') NOT NULL DEFAULT 'PENDING',
    `registered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approved_at` DATETIME(3) NULL,
    `approved_by_id` INTEGER NULL,
    `rejection_reason` TEXT NULL,
    `notes` TEXT NULL,

    INDEX `registrations_student_id_idx`(`student_id`),
    UNIQUE INDEX `registrations_event_id_student_id_key`(`event_id`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `status` ENUM('NOT_CHECKED', 'CHECKED_IN', 'CHECKED_OUT', 'LATE', 'EARLY_LEAVE', 'ABSENT') NOT NULL DEFAULT 'NOT_CHECKED',
    `check_in_time` VARCHAR(10) NULL,
    `check_out_time` VARCHAR(10) NULL,
    `notes` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `attendances_student_id_idx`(`student_id`),
    UNIQUE INDEX `attendances_event_id_student_id_key`(`event_id`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_credits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `event_id` INTEGER NOT NULL,
    `semester_id` INTEGER NOT NULL,
    `credit_value` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'RECORDED', 'REJECTED', 'ADJUSTED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `adjusted_by_id` INTEGER NULL,
    `adjustment_reason` TEXT NULL,
    `adjusted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `work_credits_event_id_idx`(`event_id`),
    INDEX `work_credits_semester_id_idx`(`semester_id`),
    UNIQUE INDEX `work_credits_student_id_event_id_key`(`student_id`, `event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaints` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `student_id` INTEGER NOT NULL,
    `event_id` INTEGER NULL,
    `type` ENUM('CREDIT', 'ATTENDANCE', 'SCHEDULE', 'ORGANIZER', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `evidence` TEXT NULL,
    `status` ENUM('SUBMITTED', 'PROCESSING', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    `response` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `complaints_code_key`(`code`),
    INDEX `complaints_student_id_idx`(`student_id`),
    INDEX `complaints_event_id_idx`(`event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaint_timelines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `complaint_id` INTEGER NOT NULL,
    `status` ENUM('SUBMITTED', 'PROCESSING', 'RESOLVED', 'REJECTED') NOT NULL,
    `note` TEXT NOT NULL,
    `actor` VARCHAR(150) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `complaint_timelines_complaint_id_idx`(`complaint_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('REGISTRATION', 'EVENT', 'CREDIT', 'COMPLAINT', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_idx`(`user_id`),
    INDEX `notifications_is_read_idx`(`is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `action` VARCHAR(150) NOT NULL,
    `affected_item` VARCHAR(255) NOT NULL,
    `old_value` TEXT NULL,
    `new_value` TEXT NULL,
    `ip_address` VARCHAR(50) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semester_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `school_year` VARCHAR(20) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `required_workdays` INTEGER NOT NULL DEFAULT 12,
    `is_active` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `site_name` VARCHAR(100) NOT NULL DEFAULT 'DThU Workday',
    `support_email` VARCHAR(150) NOT NULL DEFAULT 'workday@dthu.edu.vn',
    `support_phone` VARCHAR(20) NOT NULL DEFAULT '02776543210',
    `default_required_workdays` INTEGER NOT NULL DEFAULT 12,
    `max_concurrent_registrations` INTEGER NOT NULL DEFAULT 3,
    `maintenance_mode` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_faculty_id_fkey` FOREIGN KEY (`faculty_id`) REFERENCES `faculties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_faculty_id_fkey` FOREIGN KEY (`faculty_id`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_events` ADD CONSTRAINT `work_events_organizer_id_fkey` FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `work_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `work_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_credits` ADD CONSTRAINT `work_credits_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_credits` ADD CONSTRAINT `work_credits_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `work_events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_credits` ADD CONSTRAINT `work_credits_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester_configs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_credits` ADD CONSTRAINT `work_credits_adjusted_by_id_fkey` FOREIGN KEY (`adjusted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `work_events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_timelines` ADD CONSTRAINT `complaint_timelines_complaint_id_fkey` FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
