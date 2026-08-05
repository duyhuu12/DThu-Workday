-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'LOCKED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WorkShift" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'FULLDAY');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'OPEN', 'ONGOING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'WAITLIST', 'COMPLETED', 'CANCELLED', 'ABSENT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('NOT_CHECKED', 'CHECKED_IN', 'CHECKED_OUT', 'LATE', 'EARLY_LEAVE', 'ABSENT');

-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('PENDING', 'RECORDED', 'REJECTED', 'ADJUSTED');

-- CreateEnum
CREATE TYPE "ComplaintType" AS ENUM ('CREDIT', 'ATTENDANCE', 'SCHEDULE', 'ORGANIZER', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('SUBMITTED', 'PROCESSING', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REGISTRATION', 'EVENT', 'CREDIT', 'COMPLAINT', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "phone" VARCHAR(20),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(50) NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "faculty_id" INTEGER NOT NULL,
    "school_year" VARCHAR(20) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "student_code" VARCHAR(50) NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20),
    "faculty_id" INTEGER NOT NULL,
    "class_id" INTEGER NOT NULL,
    "school_year" VARCHAR(20) NOT NULL,
    "gender" VARCHAR(10) NOT NULL,
    "birth_date" TIMESTAMP(3),
    "hometown" VARCHAR(150),
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "required_workdays" INTEGER NOT NULL DEFAULT 12,
    "accumulated_workdays" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "completed_workdays" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_events" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "work_content" TEXT NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "date" DATE NOT NULL,
    "start_time" VARCHAR(10) NOT NULL,
    "end_time" VARCHAR(10) NOT NULL,
    "shift" "WorkShift" NOT NULL DEFAULT 'MORNING',
    "registration_open" TIMESTAMP(3) NOT NULL,
    "registration_close" TIMESTAMP(3) NOT NULL,
    "cancellation_deadline" TIMESTAMP(3) NOT NULL,
    "max_capacity" INTEGER NOT NULL,
    "registered_count" INTEGER NOT NULL DEFAULT 0,
    "workday_credit" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "clothing_requirements" TEXT,
    "equipment_requirements" TEXT,
    "contact_person" VARCHAR(100) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "organizer_id" INTEGER NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "eligible_faculty_ids" TEXT,
    "eligible_class_ids" TEXT,
    "eligible_school_years" TEXT,

    CONSTRAINT "work_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "approved_by_id" INTEGER,
    "rejection_reason" TEXT,
    "notes" TEXT,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'NOT_CHECKED',
    "check_in_time" VARCHAR(10),
    "check_out_time" VARCHAR(10),
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_credits" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "semester_id" INTEGER NOT NULL,
    "credit_value" DOUBLE PRECISION NOT NULL,
    "status" "CreditStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "adjusted_by_id" INTEGER,
    "adjustment_reason" TEXT,
    "adjusted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "student_id" INTEGER NOT NULL,
    "event_id" INTEGER,
    "type" "ComplaintType" NOT NULL DEFAULT 'OTHER',
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'SUBMITTED',
    "response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_timelines" (
    "id" SERIAL NOT NULL,
    "complaint_id" INTEGER NOT NULL,
    "status" "ComplaintStatus" NOT NULL,
    "note" TEXT NOT NULL,
    "actor" VARCHAR(150) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" VARCHAR(150) NOT NULL,
    "affected_item" VARCHAR(255) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "ip_address" VARCHAR(50),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semester_configs" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "school_year" VARCHAR(20) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "required_workdays" INTEGER NOT NULL DEFAULT 12,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "semester_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "site_name" VARCHAR(100) NOT NULL DEFAULT 'DThU Workday',
    "support_email" VARCHAR(150) NOT NULL DEFAULT 'workday@dthu.edu.vn',
    "support_phone" VARCHAR(20) NOT NULL DEFAULT '02776543210',
    "default_required_workdays" INTEGER NOT NULL DEFAULT 12,
    "max_concurrent_registrations" INTEGER NOT NULL DEFAULT 3,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_code_key" ON "faculties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "classes_code_key" ON "classes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_code_key" ON "students"("student_code");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "work_events_code_key" ON "work_events"("code");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_event_id_student_id_key" ON "registrations"("event_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_event_id_student_id_key" ON "attendances"("event_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_credits_student_id_event_id_key" ON "work_credits"("student_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_code_key" ON "complaints"("code");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_events" ADD CONSTRAINT "work_events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "work_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "work_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_credits" ADD CONSTRAINT "work_credits_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_credits" ADD CONSTRAINT "work_credits_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "work_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_credits" ADD CONSTRAINT "work_credits_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semester_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "work_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_timelines" ADD CONSTRAINT "complaint_timelines_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
