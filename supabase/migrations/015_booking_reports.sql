-- 授業問題報告テーブル（保護者が講師の遅刻・欠勤等を報告）

CREATE TYPE booking_report_reason AS ENUM ('late', 'absent', 'other');
CREATE TYPE booking_report_status AS ENUM ('pending', 'approved', 'rejected', 'auto_approved');

CREATE TABLE booking_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  reason booking_report_reason NOT NULL,
  description TEXT,
  status booking_report_status NOT NULL DEFAULT 'pending',
  deadline TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE booking_reports ENABLE ROW LEVEL SECURITY;

-- 保護者: 自分が作成した報告を閲覧
CREATE POLICY "guardian_select_report" ON booking_reports FOR SELECT
  USING (reporter_id = auth.uid());

-- 保護者: 報告を作成
CREATE POLICY "guardian_insert_report" ON booking_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- 講師: 自分の予約に紐づく報告を閲覧
CREATE POLICY "teacher_select_report" ON booking_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_reports.booking_id
      AND bookings.teacher_id = auth.uid()
  ));

-- 講師: 自分の予約に紐づく報告を更新（承認/拒否）
CREATE POLICY "teacher_update_report" ON booking_reports FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_reports.booking_id
      AND bookings.teacher_id = auth.uid()
  ));
