-- Atomic ticket balance adjustment function
-- Prevents race conditions when multiple clients adjust the same balance concurrently
CREATE OR REPLACE FUNCTION adjust_ticket_balance(
  p_ticket_balance_id UUID,
  p_delta_minutes INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ticket_balances
  SET remaining_minutes = GREATEST(0, remaining_minutes + p_delta_minutes)
  WHERE id = p_ticket_balance_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket balance not found: %', p_ticket_balance_id;
  END IF;
END;
$$;
