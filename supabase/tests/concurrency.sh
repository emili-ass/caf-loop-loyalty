#!/usr/bin/env bash
# Prueba de transacciones simultáneas. Crea datos ficticios temporales y los borra al final.
set -euo pipefail
EMP=00000000-0000-0000-0000-00000000ff02
CUS=00000000-0000-0000-0000-00000000ff03
CAFE=$(psql -tAq -c "select id from public.cafes where slug='la-molienda'")

cleanup() {
  psql -q -c "delete from public.cafe_members where user_id in ('$EMP','$CUS');
    delete from public.loyalty_cards where customer_id='$CUS';
    delete from auth.users where id in ('$EMP','$CUS');" >/dev/null
}
trap cleanup EXIT
cleanup

psql -q -c "insert into auth.users (id,email,aud,role) values ('$EMP','conc.emp@test.invalid','authenticated','authenticated'),('$CUS','conc.cus@test.invalid','authenticated','authenticated');
  insert into public.cafe_members (cafe_id,user_id,role) values ('$CAFE','$EMP','employee');
  insert into public.loyalty_cards (cafe_id,customer_id,code,stamps,rewards_available) values ('$CAFE','$CUS','CL-CONC-TEST-0000-0001',0,1);" >/dev/null

as_emp() {
  psql -tAq -c "set role authenticated; select set_config('request.jwt.claims','{\"sub\":\"$EMP\",\"role\":\"authenticated\"}',false); $1" 2>&1 | tail -1
}

# 10 compras simultáneas con claves distintas => 10 sellos exactos (sin perder actualizaciones)
for i in $(seq 1 10); do
  as_emp "select public.register_purchase('$CAFE','CL-CONC-TEST-0000-0001',50,'conc-distinta-$(printf %06d $i)');" >/dev/null &
done
wait
# 6 envíos simultáneos con la MISMA clave => 1 compra
for i in $(seq 1 6); do
  as_emp "select public.register_purchase('$CAFE','CL-CONC-TEST-0000-0001',50,'conc-misma-clave-0001');" >/dev/null &
done
wait
# 6 canjes simultáneos con claves distintas y 1 recompensa disponible (+1 ganada por 8 sellos) => 2 canjes
for i in $(seq 1 6); do
  as_emp "select public.redeem_reward('$CAFE','CL-CONC-TEST-0000-0001','conc-canje-$(printf %06d $i)');" >/dev/null &
done
wait

R=$(psql -tAq -c "select (select count(*) from public.purchases p join public.loyalty_cards c on c.id=p.card_id where c.customer_id='$CUS')
  || ',' || (select count(*) from public.redemptions where customer_id='$CUS')
  || ',' || (select stamps || ',' || rewards_available from public.loyalty_cards where customer_id='$CUS')")
IFS=, read -r P RD S RW <<<"$R"
fail=0
[ "$P" = "11" ] && echo "OK: 16 envíos simultáneos = 11 compras (10 distintas + 1 repetida)" || { echo "FALLÓ: compras=$P"; fail=1; }
[ "$S" = "3" ] && echo "OK: 11 sellos => 3 en la tarjeta tras completar 8" || { echo "FALLÓ: sellos=$S"; fail=1; }
[ "$RD" = "2" ] && [ "$RW" = "0" ] && echo "OK: 6 canjes simultáneos con 2 recompensas = 2 canjes, 0 restantes" || { echo "FALLÓ: canjes=$RD restantes=$RW"; fail=1; }
exit $fail
