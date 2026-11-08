-- La Molienda and Tueste del Norte: 10 stamps, 2 welcome stamps.
-- Existing cards retain their earned progress. Welcome stamps are granted only
-- by join_cafe when inserting a new card, never on replay or on the client.
BEGIN;
ALTER TABLE public.cafes DROP CONSTRAINT cafes_stamps_required_check;
ALTER TABLE public.cafes ADD CONSTRAINT cafes_stamps_required_check CHECK (stamps_required IN (8, 10));
ALTER TABLE public.cafes ADD COLUMN initial_stamps int NOT NULL DEFAULT 0;
ALTER TABLE public.cafes ADD CONSTRAINT cafes_initial_stamps_check CHECK (initial_stamps >= 0 AND initial_stamps < stamps_required);
ALTER TABLE public.loyalty_cards DROP CONSTRAINT loyalty_cards_stamps_check;
ALTER TABLE public.loyalty_cards ADD CONSTRAINT loyalty_cards_stamps_check CHECK (stamps BETWEEN 0 AND 9);
UPDATE public.cafes SET stamps_required = 10, initial_stamps = 2,
  reward_description = regexp_replace(reward_description, '\m8\M', '10', 'g')
WHERE lower(name) LIKE '%molienda%' OR lower(name) LIKE '%tueste%del%norte%';

CREATE OR REPLACE FUNCTION public.join_cafe(_cafe_id uuid)
RETURNS public.loyalty_cards LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  card public.loyalty_cards;
  attempt int := 0;
  welcome int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.cafes WHERE id = _cafe_id) THEN
    RAISE EXCEPTION 'cafe_not_found' USING ERRCODE = 'P0002';
  END IF;
  SELECT initial_stamps INTO welcome FROM public.cafes WHERE id = _cafe_id;
  SELECT * INTO card FROM public.loyalty_cards WHERE cafe_id = _cafe_id AND customer_id = uid;
  IF FOUND THEN RETURN card; END IF;
  LOOP
    attempt := attempt + 1;
    BEGIN
      INSERT INTO public.loyalty_cards (cafe_id, customer_id, code, stamps)
      VALUES (_cafe_id, uid, public.generate_card_code(), welcome)
      RETURNING * INTO card;
      RETURN card;
    EXCEPTION WHEN unique_violation THEN
      SELECT * INTO card FROM public.loyalty_cards WHERE cafe_id = _cafe_id AND customer_id = uid;
      IF FOUND THEN RETURN card; END IF;
      IF attempt >= 5 THEN RAISE; END IF;
    END;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.register_purchase(_cafe_id uuid, _card_code text, _amount numeric, _idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  card public.loyalty_cards;
  existing public.purchases;
  p public.purchases;
  new_stamps int;
  target int;
  earned boolean := false;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000'; END IF;
  IF NOT public.is_cafe_staff(_cafe_id) THEN RAISE EXCEPTION 'not_cafe_staff' USING ERRCODE = '42501'; END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount >= 100000 THEN RAISE EXCEPTION 'invalid_amount' USING ERRCODE = '22023'; END IF;
  IF _idempotency_key IS NULL OR length(_idempotency_key) NOT BETWEEN 16 AND 100 THEN
    RAISE EXCEPTION 'invalid_idempotency_key' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO card FROM public.loyalty_cards
    WHERE cafe_id = _cafe_id AND code = upper(trim(_card_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'card_not_found' USING ERRCODE = 'P0002'; END IF;

  SELECT * INTO existing FROM public.purchases WHERE cafe_id = _cafe_id AND idempotency_key = _idempotency_key;
  IF FOUND THEN
    IF existing.card_id <> card.id OR existing.amount <> round(_amount, 2) THEN
      RAISE EXCEPTION 'idempotency_key_conflict' USING ERRCODE = '23505';
    END IF;
    RETURN jsonb_build_object('replayed', true, 'purchase_id', existing.id,
      'stamps', card.stamps, 'rewards_available', card.rewards_available);
  END IF;

  INSERT INTO public.purchases (cafe_id, card_id, customer_id, employee_id, amount, idempotency_key)
  VALUES (_cafe_id, card.id, card.customer_id, uid, round(_amount, 2), _idempotency_key)
  RETURNING * INTO p;

  SELECT stamps_required INTO target FROM public.cafes WHERE id = _cafe_id;
  new_stamps := card.stamps + 1;
  IF new_stamps >= target THEN new_stamps := 0; earned := true; END IF;

  UPDATE public.loyalty_cards
    SET stamps = new_stamps,
        rewards_available = rewards_available + CASE WHEN earned THEN 1 ELSE 0 END,
        updated_at = now()
    WHERE id = card.id
    RETURNING * INTO card;

  INSERT INTO public.stamp_events (cafe_id, card_id, customer_id, purchase_id, employee_id, stamps_after, reward_earned)
  VALUES (_cafe_id, card.id, card.customer_id, p.id, uid, new_stamps, earned);

  RETURN jsonb_build_object('replayed', false, 'purchase_id', p.id, 'stamps', card.stamps,
    'rewards_available', card.rewards_available, 'reward_earned', earned);
END $$;


-- Preserve the existing authenticated-only RPC boundary and SELECT-only tables.
REVOKE EXECUTE ON FUNCTION public.join_cafe(uuid), public.register_purchase(uuid, text, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_cafe(uuid), public.register_purchase(uuid, text, numeric, text) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
