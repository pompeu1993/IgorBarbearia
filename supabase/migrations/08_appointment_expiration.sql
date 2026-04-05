-- 1. Index to optimize availability queries
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(date, status);

-- 2. Update get_booked_slots to ignore PENDING appointments older than 30 minutes
CREATE OR REPLACE FUNCTION public.get_booked_slots(start_time timestamp with time zone, end_time timestamp with time zone)
RETURNS TABLE (booked_date timestamp with time zone) AS $$
BEGIN
  RETURN QUERY
  SELECT date
  FROM public.appointments
  WHERE date >= start_time
    AND date <= end_time
    AND (
      status = 'CONFIRMED'
      OR (status = 'PENDING' AND created_at >= NOW() - INTERVAL '30 minutes')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a function to cleanup (cancel) expired unpaid appointments
CREATE OR REPLACE FUNCTION public.cleanup_expired_appointments()
RETURNS INTEGER AS $$
DECLARE
  cancelled_count INTEGER;
BEGIN
  UPDATE public.appointments
  SET status = 'CANCELLED',
      updated_at = NOW()
  WHERE status = 'PENDING'
    AND created_at < NOW() - INTERVAL '30 minutes';

  GET DIAGNOSTICS cancelled_count = ROW_COUNT;
  RETURN cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
