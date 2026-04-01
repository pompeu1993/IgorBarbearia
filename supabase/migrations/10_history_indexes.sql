CREATE INDEX IF NOT EXISTS idx_appointments_user_date_desc
ON public.appointments (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_user_service_date_desc
ON public.appointments (user_id, service_id, date DESC);
