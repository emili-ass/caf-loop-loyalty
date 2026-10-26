CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TYPE public.cafe_role AS ENUM ('owner', 'employee');

-- Cafés
CREATE TABLE public.cafes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  address text,
  reviews_url text,
  hours jsonb NOT NULL DEFAULT '[]'::jsonb,
  reward_description text NOT NULL DEFAULT 'Una bebida gratis',
  stamps_required int NOT NULL DEFAULT 8 CHECK (stamps_required = 8),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cafes TO anon, authenticated;
GRANT UPDATE (name, tagline, address, reviews_url, hours, reward_description) ON public.cafes TO authenticated;
GRANT ALL ON public.cafes TO service_role;
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Staff membership (roles per café)
CREATE TABLE public.cafe_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.cafe_role NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cafe_id, user_id)
);
GRANT SELECT ON public.cafe_members TO authenticated;
GRANT ALL ON public.cafe_members TO service_role;
ALTER TABLE public.cafe_members ENABLE ROW LEVEL SECURITY;

-- Loyalty cards
CREATE TABLE public.loyalty_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  stamps int NOT NULL DEFAULT 0 CHECK (stamps BETWEEN 0 AND 7),
  rewards_available int NOT NULL DEFAULT 0 CHECK (rewards_available >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cafe_id, customer_id)
);
GRANT SELECT ON public.loyalty_cards TO authenticated;
GRANT ALL ON public.loyalty_cards TO service_role;
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;

-- Purchases (manually confirmed by staff)
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0 AND amount < 100000),
  verification text NOT NULL DEFAULT 'employee_confirmed' CHECK (verification = 'employee_confirmed'),
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 16 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cafe_id, idempotency_key)
);
GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.stamp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  purchase_id uuid NOT NULL UNIQUE REFERENCES public.purchases(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL,
  stamps_after int NOT NULL,
  reward_earned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stamp_events TO authenticated;
GRANT ALL ON public.stamp_events TO service_role;
ALTER TABLE public.stamp_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 16 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cafe_id, idempotency_key)
);
GRANT SELECT ON public.redemptions TO authenticated;
GRANT ALL ON public.redemptions TO service_role;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX ON public.purchases (cafe_id, created_at);
CREATE INDEX ON public.stamp_events (cafe_id, created_at);
CREATE INDEX ON public.redemptions (cafe_id, created_at);
CREATE INDEX ON public.loyalty_cards (customer_id);
CREATE INDEX ON public.cafe_members (user_id);

-- Helpers: always evaluate for the calling user (auth.uid()), never a passed-in id
CREATE FUNCTION public.is_cafe_staff(_cafe_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.cafe_members
    WHERE cafe_id = _cafe_id AND user_id = auth.uid() AND active);
$$;
CREATE FUNCTION public.is_cafe_owner(_cafe_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.cafe_members
    WHERE cafe_id = _cafe_id AND user_id = auth.uid() AND active AND role = 'owner');
$$;
CREATE FUNCTION public.is_staff_of_customer(_customer_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.loyalty_cards c
    JOIN public.cafe_members m ON m.cafe_id = c.cafe_id
    WHERE c.customer_id = _customer_id AND m.user_id = auth.uid() AND m.active);
$$;
REVOKE EXECUTE ON FUNCTION public.is_cafe_staff(uuid), public.is_cafe_owner(uuid), public.is_staff_of_customer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_cafe_staff(uuid), public.is_cafe_owner(uuid), public.is_staff_of_customer(uuid) TO authenticated;

-- Policies (read-only for clients on operational tables)
CREATE POLICY "cafes public read" ON public.cafes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "owners update own cafe" ON public.cafes FOR UPDATE TO authenticated
  USING (public.is_cafe_owner(id)) WITH CHECK (public.is_cafe_owner(id));

CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "staff read customer profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff_of_customer(id));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "read own membership" ON public.cafe_members FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "staff read colleagues" ON public.cafe_members FOR SELECT TO authenticated USING (public.is_cafe_staff(cafe_id));

CREATE POLICY "customer reads own cards" ON public.loyalty_cards FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "staff read cafe cards" ON public.loyalty_cards FOR SELECT TO authenticated USING (public.is_cafe_staff(cafe_id));

CREATE POLICY "customer reads own purchases" ON public.purchases FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "staff read cafe purchases" ON public.purchases FOR SELECT TO authenticated USING (public.is_cafe_staff(cafe_id));

CREATE POLICY "customer reads own stamps" ON public.stamp_events FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "staff read cafe stamps" ON public.stamp_events FOR SELECT TO authenticated USING (public.is_cafe_staff(cafe_id));

CREATE POLICY "customer reads own redemptions" ON public.redemptions FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "staff read cafe redemptions" ON public.redemptions FOR SELECT TO authenticated USING (public.is_cafe_staff(cafe_id));

-- Profile on signup
CREATE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, left(coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 80))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Random card code: 'CL-' + 16 chars from a 32-symbol alphabet (80 bits, CSPRNG)
CREATE FUNCTION public.generate_card_code()
RETURNS text LANGUAGE plpgsql VOLATILE SET search_path = public, extensions AS $$
DECLARE
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789X';
  b bytea := extensions.gen_random_bytes(16);
  out text := '';
  i int;
BEGIN
  FOR i IN 0..15 LOOP
    out := out || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
  END LOOP;
  RETURN 'CL-' || substr(out,1,4) || '-' || substr(out,5,4) || '-' || substr(out,9,4) || '-' || substr(out,13,4);
END $$;
REVOKE EXECUTE ON FUNCTION public.generate_card_code() FROM PUBLIC, anon, authenticated;

-- Customer joins a café (creates own card)
CREATE FUNCTION public.join_cafe(_cafe_id uuid)
RETURNS public.loyalty_cards LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  card public.loyalty_cards;
  attempt int := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.cafes WHERE id = _cafe_id) THEN
    RAISE EXCEPTION 'cafe_not_found' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO card FROM public.loyalty_cards WHERE cafe_id = _cafe_id AND customer_id = uid;
  IF FOUND THEN RETURN card; END IF;
  LOOP
    attempt := attempt + 1;
    BEGIN
      INSERT INTO public.loyalty_cards (cafe_id, customer_id, code)
      VALUES (_cafe_id, uid, public.generate_card_code())
      RETURNING * INTO card;
      RETURN card;
    EXCEPTION WHEN unique_violation THEN
      SELECT * INTO card FROM public.loyalty_cards WHERE cafe_id = _cafe_id AND customer_id = uid;
      IF FOUND THEN RETURN card; END IF;
      IF attempt >= 5 THEN RAISE; END IF;
    END;
  END LOOP;
END $$;

-- Staff confirms a purchase and grants exactly one stamp
CREATE FUNCTION public.register_purchase(_cafe_id uuid, _card_code text, _amount numeric, _idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  card public.loyalty_cards;
  existing public.purchases;
  p public.purchases;
  new_stamps int;
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

  new_stamps := card.stamps + 1;
  IF new_stamps >= 8 THEN new_stamps := 0; earned := true; END IF;

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

-- Staff redeems one available reward
CREATE FUNCTION public.redeem_reward(_cafe_id uuid, _card_code text, _idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  card public.loyalty_cards;
  existing public.redemptions;
  r public.redemptions;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000'; END IF;
  IF NOT public.is_cafe_staff(_cafe_id) THEN RAISE EXCEPTION 'not_cafe_staff' USING ERRCODE = '42501'; END IF;
  IF _idempotency_key IS NULL OR length(_idempotency_key) NOT BETWEEN 16 AND 100 THEN
    RAISE EXCEPTION 'invalid_idempotency_key' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO card FROM public.loyalty_cards
    WHERE cafe_id = _cafe_id AND code = upper(trim(_card_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'card_not_found' USING ERRCODE = 'P0002'; END IF;

  SELECT * INTO existing FROM public.redemptions WHERE cafe_id = _cafe_id AND idempotency_key = _idempotency_key;
  IF FOUND THEN
    IF existing.card_id <> card.id THEN
      RAISE EXCEPTION 'idempotency_key_conflict' USING ERRCODE = '23505';
    END IF;
    RETURN jsonb_build_object('replayed', true, 'redemption_id', existing.id, 'rewards_available', card.rewards_available);
  END IF;

  IF card.rewards_available < 1 THEN RAISE EXCEPTION 'no_reward_available' USING ERRCODE = 'P0001'; END IF;

  UPDATE public.loyalty_cards SET rewards_available = rewards_available - 1, updated_at = now()
    WHERE id = card.id RETURNING * INTO card;
  INSERT INTO public.redemptions (cafe_id, card_id, customer_id, employee_id, idempotency_key)
  VALUES (_cafe_id, card.id, card.customer_id, uid, _idempotency_key) RETURNING * INTO r;

  RETURN jsonb_build_object('replayed', false, 'redemption_id', r.id, 'rewards_available', card.rewards_available);
END $$;

REVOKE EXECUTE ON FUNCTION public.join_cafe(uuid), public.register_purchase(uuid, text, numeric, text), public.redeem_reward(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_cafe(uuid), public.register_purchase(uuid, text, numeric, text), public.redeem_reward(uuid, text, text) TO authenticated;
