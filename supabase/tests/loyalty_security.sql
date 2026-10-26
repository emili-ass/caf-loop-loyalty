-- Pruebas de seguridad de CaféLoop. Todo corre en una transacción y se revierte.
-- Ejecutar: bash supabase/tests/run.sh
\set ON_ERROR_STOP on
BEGIN;

-- Usuarios ficticios
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role) VALUES
 ('00000000-0000-0000-0000-0000000000a1','owner.a@test.invalid','{"display_name":"Dueña A"}','authenticated','authenticated'),
 ('00000000-0000-0000-0000-0000000000a2','emp.a@test.invalid','{}','authenticated','authenticated'),
 ('00000000-0000-0000-0000-0000000000b2','emp.b@test.invalid','{}','authenticated','authenticated'),
 ('00000000-0000-0000-0000-0000000000c1','cliente1@test.invalid','{}','authenticated','authenticated'),
 ('00000000-0000-0000-0000-0000000000c2','cliente2@test.invalid','{}','authenticated','authenticated'),
 ('00000000-0000-0000-0000-0000000000e9','exempleado@test.invalid','{}','authenticated','authenticated');

CREATE TEMP TABLE t AS SELECT
  (SELECT id FROM public.cafes WHERE slug='la-molienda') AS a,
  (SELECT id FROM public.cafes WHERE slug='tueste-norte') AS b;
GRANT SELECT ON t TO authenticated, anon;

INSERT INTO public.cafe_members (cafe_id, user_id, role, active)
SELECT a,'00000000-0000-0000-0000-0000000000a1','owner',true FROM t UNION ALL
SELECT a,'00000000-0000-0000-0000-0000000000a2','employee',true FROM t UNION ALL
SELECT b,'00000000-0000-0000-0000-0000000000b2','employee',true FROM t UNION ALL
SELECT a,'00000000-0000-0000-0000-0000000000e9','employee',false FROM t;

CREATE FUNCTION pg_temp.as_user(uid text) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
CREATE FUNCTION pg_temp.ok(cond boolean, name text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF cond IS NOT TRUE THEN RAISE EXCEPTION 'FALLÓ: %', name; END IF;
  RAISE NOTICE 'OK: %', name;
END $$;
GRANT EXECUTE ON FUNCTION pg_temp.as_user(text), pg_temp.ok(boolean, text) TO authenticated, anon;

-- 1. Perfil creado al registrarse
SELECT pg_temp.ok((SELECT display_name FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000a1') = 'Dueña A', 'trigger crea perfil');

-- 2. Clientes se unen y obtienen código aleatorio
SET LOCAL ROLE authenticated;
SELECT pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT public.join_cafe((SELECT a FROM t));
SELECT public.join_cafe((SELECT b FROM t));
SELECT pg_temp.as_user('00000000-0000-0000-0000-0000000000c2');
SELECT public.join_cafe((SELECT a FROM t));
RESET ROLE;
SELECT pg_temp.ok((SELECT count(*) = 3 AND count(DISTINCT code) = 3 AND bool_and(code ~ '^CL-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$') FROM public.loyalty_cards), 'códigos únicos con formato aleatorio');
SELECT pg_temp.ok((SELECT count(DISTINCT public.generate_card_code()) = 2000 FROM generate_series(1,2000)), '2000 códigos generados sin colisión');

CREATE TEMP TABLE codes AS SELECT cafe_id, customer_id, code FROM public.loyalty_cards;
GRANT SELECT ON codes TO authenticated;
CREATE FUNCTION pg_temp.code(cafe uuid, cust text) RETURNS text LANGUAGE sql AS $$
  SELECT code FROM codes WHERE cafe_id = cafe AND customer_id = cust::uuid; $$;
GRANT EXECUTE ON FUNCTION pg_temp.code(uuid, text) TO authenticated;

-- 3. Cliente sólo ve lo suyo y no puede manipular sellos
SET LOCAL ROLE authenticated;
SELECT pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT pg_temp.ok((SELECT count(*) FROM public.loyalty_cards) = 2, 'cliente 1 ve solo sus 2 tarjetas');
DO $$ BEGIN
  UPDATE public.loyalty_cards SET stamps = 7;
  RAISE EXCEPTION 'FALLÓ: cliente pudo actualizar sellos';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK: cliente no puede modificar sellos'; END $$;
DO $$ BEGIN
  INSERT INTO public.stamp_events (cafe_id, card_id, customer_id, purchase_id, employee_id, stamps_after)
  VALUES (gen_random_uuid(), gen_random_uuid(), auth.uid(), gen_random_uuid(), auth.uid(), 1);
  RAISE EXCEPTION 'FALLÓ: cliente insertó sello';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK: cliente no puede insertar sellos'; END $$;
DO $$ BEGIN
  INSERT INTO public.cafe_members (cafe_id, user_id, role) VALUES ((SELECT a FROM t), auth.uid(), 'owner');
  RAISE EXCEPTION 'FALLÓ: cliente se nombró propietario';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK: cliente no puede asignarse un rol'; END $$;
DO $$ BEGIN
  PERFORM public.register_purchase((SELECT a FROM t), pg_temp.code((SELECT a FROM t),'00000000-0000-0000-0000-0000000000c1'), 50, 'cliente-intenta-sellar-0001');
  RAISE EXCEPTION 'FALLÓ: cliente otorgó sello';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK: cliente no puede otorgarse sellos'; END $$;
DO $$ BEGIN
  PERFORM public.redeem_reward((SELECT a FROM t), pg_temp.code((SELECT a FROM t),'00000000-0000-0000-0000-0000000000c1'), 'cliente-intenta-canjear-001');
  RAISE EXCEPTION 'FALLÓ: cliente canjeó';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK: cliente no puede canjear por sí mismo'; END $$;
SELECT pg_temp.ok((SELECT count(*) FROM public.profiles) = 1, 'cliente solo ve su perfil');
RESET ROLE;

-- 4. Anónimo no puede ejecutar operaciones
SET LOCAL ROLE anon;
DO $$ BEGIN
  PERFORM public.register_purchase((SELECT a FROM t), 'CL-XXXX', 50, 'anonimo-intenta-sellar-01');
  RAISE EXCEPTION 'FALLÓ: anónimo ejecutó register_purchase';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK: anónimo sin permiso de ejecución'; END $$;
DO $$ BEGIN
  PERFORM 1 FROM public.loyalty_cards;
  RAISE EXCEPTION 'FALLÓ: anónimo leyó tarjetas';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK: anónimo no lee tarjetas'; END $$;
RESET ROLE;

-- 5. Empleado autorizado otorga sellos; 8 sellos = 1 recompensa
SET LOCAL ROLE authenticated;
SELECT pg_temp.as_user('00000000-0000-0000-0000-0000000000a2');
DO $$ DECLARE i int; r jsonb; BEGIN
  FOR i IN 1..8 LOOP
    r := public.register_purchase((SELECT a FROM t), lower(pg_temp.code((SELECT a FROM t),'00000000-0000-0000-0000-0000000000c1')), 55, 'compra-prueba-ocho-' || lpad(i::text, 4, '0'));
  END LOOP;
  PERFORM pg_temp.ok((r->>'stamps')::int = 0 AND (r->>'rewards_available')::int = 1 AND (r->>'reward_earned')::boolean, '8 sellos generan 1 recompensa y reinician la tarjeta');
END $$;
SELECT pg_temp.ok((SELECT bool_and(verification = 'employee_confirmed') FROM public.purchases), 'compras marcadas como confirmación del empleado');

-- 6. Idempotencia
DO $$ DECLARE r jsonb; BEGIN
  r := public.register_purchase((SELECT a FROM t), pg_temp.code((SELECT a FROM t),'00000000-0000-0000-0000-0000000000c1'), 55, 'compra-prueba-ocho-0008');
  PERFORM pg_temp.ok((r->>'replayed')::boolean, 'misma clave y mismos datos devuelve el resultado anterior');
END $$;
SELECT pg_temp.ok((SELECT count(*) FROM public.purchases) = 8, 'repetición no crea compra extra');
DO $$ BEGIN
  PERFORM public.register_purchase((SELECT a FROM t), pg_temp.code((SELECT a FROM t),'00000000-0000-0000-0000-0000000000c1'), 99, 'compra-prueba-ocho-0008');
  RAISE EXCEPTION 'FALLÓ: clave reutilizada con otro monto aceptada';
EXCEPTION WHEN unique_violation THEN RAISE NOTICE 'OK: clave reutilizada con otro monto rechazada'; END $$;
DO $$ BEGIN
  PERFORM public.register_purchase((SELECT a FROM t), pg_temp.code((SELECT a FROM t),'00000000-0000-0000-0000-0000000000c2'), 55, 'compra-prueba-ocho-0008');
  RAISE EXCEPTION 'FALLÓ: clave reutilizada con otra tarjeta aceptada';
EXCEPTION WHEN unique_violation THEN RAISE NOTICE 'OK: clave reutilizada con otra tarjeta rechazada'; END $$;

-- 7. Canje y canje duplicado
DO $$ DECLARE r jsonb; BEGIN
  r := public.redeem_reward((SELECT a FROM t), pg_temp.code((SELECT a FROM t),'00000000-0000-0000-0000-0000000000c1'), 'canje-prueba-000001');
  PERFORM pg_temp.ok((r->>'rewards_available')::int = 0, 'canje descuenta la recompensa');
  r := public.redeem_reward((SELECT a FROM t), pg_temp.code((SELECT a FROM t),'00000000-0000-0000-0000-0000000000c1'), 'canje-prueba-000001');
  PERFORM pg_temp.ok((r->>'replayed')::boolean, 'reintento del mismo canje no descuenta dos veces');
END $$;
DO $$ BEGIN
  PERFORM public.redeem_reward((SELECT a FROM t), pg_temp.code((SELECT a FROM t),'00000000-0000-0000-0000-0000000000c1'), 'canje-prueba-000002');
  RAISE EXCEPTION 'FALLÓ: segundo canje sin recompensa aceptado';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'no_reward_available' THEN RAISE; END IF;
  RAISE NOTICE 'OK: canje sin recompensa disponible rechazado'; END $$;
SELECT pg_temp.ok((SELECT count(*) FROM public.redemptions) = 1, 'solo existe un canje');

-- 8. Aislamiento entre cafeterías
SELECT pg_temp.ok((SELECT count(*) FROM public.loyalty_cards WHERE cafe_id = (SELECT b FROM t)) = 0, 'empleado A no ve tarjetas de B');
DO $$ BEGIN
  PERFORM public.register_purchase((SELECT b FROM t), pg_temp.code((SELECT b FROM t),'00000000-0000-0000-0000-0000000000c1'), 40, 'empleado-a-en-cafe-b-01');
  RAISE EXCEPTION 'FALLÓ: empleado A selló en B';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK: empleado A no puede sellar en B'; END $$;
DO $$ BEGIN
  PERFORM public.register_purchase((SELECT a FROM t), pg_temp.code((SELECT b FROM t),'00000000-0000-0000-0000-0000000000c1'), 40, 'tarjeta-b-en-cafe-a-01');
  RAISE EXCEPTION 'FALLÓ: tarjeta de B aceptada en A';
EXCEPTION WHEN no_data_found THEN RAISE NOTICE 'OK: tarjeta de otra cafetería no se acepta'; END $$;
SELECT pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
SELECT pg_temp.ok((SELECT count(*) FROM public.purchases) = 0 AND (SELECT count(*) FROM public.loyalty_cards) = 1, 'empleado B solo ve datos de B');
SELECT pg_temp.ok((SELECT count(*) FROM public.profiles WHERE id = '00000000-0000-0000-0000-0000000000c2') = 0, 'empleado B no ve clientes que solo están en A');

-- 9. Empleado inactivo
SELECT pg_temp.as_user('00000000-0000-0000-0000-0000000000e9');
DO $$ BEGIN
  PERFORM public.register_purchase((SELECT a FROM t), pg_temp.code((SELECT a FROM t),'00000000-0000-0000-0000-0000000000c2'), 40, 'empleado-inactivo-0001');
  RAISE EXCEPTION 'FALLÓ: empleado inactivo selló';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK: empleado inactivo no puede sellar'; END $$;

-- 10. Sin sesión (sub vacío)
SELECT set_config('request.jwt.claims', '{}', true);
DO $$ BEGIN
  PERFORM public.register_purchase((SELECT a FROM t), 'X', 40, 'sin-sesion-000000001');
  RAISE EXCEPTION 'FALLÓ: llamada sin identidad aceptada';
EXCEPTION WHEN invalid_authorization_specification THEN RAISE NOTICE 'OK: sin identidad se rechaza'; END $$;
RESET ROLE;

ROLLBACK;
