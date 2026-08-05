-- AddForeignKey
ALTER TABLE "work_credits" ADD CONSTRAINT "work_credits_adjusted_by_id_fkey" FOREIGN KEY ("adjusted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
