CREATE OR REPLACE FUNCTION public.get_booked_slots(start_time timestamp with time zone, end_time timestamp with time zone)
RETURNS TABLE (booked_date timestamp with time zone) AS $$
BEGIN
  RETURN QUERY
  SELECT date
  FROM public.appointments
  WHERE date >= start_time
    AND date <= end_time
    AND status IN ('PENDING', 'CONFIRMED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
