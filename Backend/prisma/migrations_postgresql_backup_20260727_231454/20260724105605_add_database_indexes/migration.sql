-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "attendances_student_id_idx" ON "attendances"("student_id");

-- CreateIndex
CREATE INDEX "classes_faculty_id_idx" ON "classes"("faculty_id");

-- CreateIndex
CREATE INDEX "complaint_timelines_complaint_id_idx" ON "complaint_timelines"("complaint_id");

-- CreateIndex
CREATE INDEX "complaints_student_id_idx" ON "complaints"("student_id");

-- CreateIndex
CREATE INDEX "complaints_event_id_idx" ON "complaints"("event_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "registrations_student_id_idx" ON "registrations"("student_id");

-- CreateIndex
CREATE INDEX "students_class_id_idx" ON "students"("class_id");

-- CreateIndex
CREATE INDEX "students_faculty_id_idx" ON "students"("faculty_id");

-- CreateIndex
CREATE INDEX "work_credits_event_id_idx" ON "work_credits"("event_id");

-- CreateIndex
CREATE INDEX "work_credits_semester_id_idx" ON "work_credits"("semester_id");

-- CreateIndex
CREATE INDEX "work_events_organizer_id_idx" ON "work_events"("organizer_id");

-- CreateIndex
CREATE INDEX "work_events_date_idx" ON "work_events"("date");
