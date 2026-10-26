# CaféLoop: autenticación y base de datos multi-cafetería

Esta es solo una propuesta. No se aplica nada hasta que la apruebes.

## 1. Estructura de datos

| Tabla | Para qué sirve | Campos principales |
|---|---|---|
| `cafes` | Cada cafetería registrada | nombre, slug, dirección, horarios, enlace de reseñas, sellos_requeridos (fijo en 8) |
| `profiles` | Datos básicos de cada usuario | nombre visible, teléfono (opcional) |
| `cafe_members` | Quién trabaja en cada cafetería y con qué rol | cafe_id, user_id, rol (`owner` / `employee`), activo |
| `loyalty_cards` | Una tarjeta por cliente y por cafetería | cafe_id, customer_id, sellos_actuales (0–8), recompensas_disponibles |
| `purchases` | Historial de compras registradas por un empleado | cafe_id, card_id, employee_id, monto, **idempotency_key única** |
| `stamp_events` | Cada sello otorgado | purchase_id (único), card_id, employee_id, fecha |
| `redemptions` | Cada recompensa canjeada | card_id, employee_id, **idempotency_key única**, fecha |

Reglas que aplica la base de datos:
- Una sola tarjeta por cliente en cada cafetería (único `cafe_id + customer_id`).
- Una compra solo puede dar un sello (`purchase_id` único en `stamp_events`).
- Los reintentos o los dobles clics no crean duplicados: cada compra y cada canje lleva una clave única generada en el navegador.
- Al llegar a 8 sellos, la tarjeta vuelve a 0 y suma 1 recompensa disponible.
- Un canje solo se hace si hay una recompensa disponible. La fila de la tarjeta se bloquea durante el canje para que dos canjes simultáneos no pasen ambos.

## 2. Roles y permisos

- Los roles viven en `cafe_members`, separados del perfil, y son por cafetería. Una persona puede ser cliente en una cafetería y empleada en otra.
- Funciones de servidor seguras, `is_cafe_member(cafe, user)` y `is_cafe_owner(cafe, user)`, para que las reglas de acceso no se llamen a sí mismas en bucle.

Row Level Security (activada en todas las tablas):

| Tabla | Cliente | Empleado | Propietario |
|---|---|---|---|
| cafes | ve los datos públicos | ve su cafetería | ve y edita su cafetería |
| profiles | ve y edita solo el suyo | ve los perfiles de clientes con tarjeta en su cafetería | igual que el empleado |
| cafe_members | — | ve a sus compañeros | gestiona empleados de su cafetería |
| loyalty_cards | solo sus tarjetas | tarjetas de su cafetería | tarjetas de su cafetería |
| purchases / stamp_events / redemptions | solo su historial | historial de su cafetería | historial de su cafetería |

**Nadie puede insertar ni modificar** directamente tarjetas, compras, sellos o canjes desde el navegador. Solo existen permisos de lectura. Todas las escrituras pasan por operaciones del servidor.

## 3. Operaciones seguras en el servidor

Son funciones de servidor que exigen sesión iniciada y llaman a funciones transaccionales de la base de datos:

- `registerPurchase({ cafeId, customerCardCode, amount, idempotencyKey })`. Comprueba que quien la llama es empleado o propietario activo de esa cafetería. Luego crea la compra y su sello en una sola transacción. Si la clave ya existe, devuelve el resultado anterior sin duplicar nada.
- `redeemReward({ cafeId, cardId, idempotencyKey })`. Hace la misma verificación de empleado, bloquea la tarjeta, valida que haya una recompensa disponible y descuenta una.
- `joinCafe({ cafeId })`. El cliente crea su propia tarjeta, empezando en 0 sellos.

El empleado identifica al cliente con un código de tarjeta corto (por ejemplo `CL-4F7K`) guardado en `loyalty_cards`. Más adelante se podrá convertir en QR.

## 4. Autenticación

- Correo y contraseña, más Google, gestionados por Lovable Cloud. Se confirma el correo, como viene por defecto.
- Al registrarse se crea automáticamente su fila en `profiles`.
- Páginas privadas: `/tarjeta` (cliente), `/empleados` (miembro de una cafetería) y `/propietario` (propietario). Si no hay sesión, redirigen a `/acceso`.
- Pantalla de recuperación de contraseña (`/reset-password`).
- El menú muestra "Salir" cuando hay sesión.

## 5. Datos ficticios

- Dos cafeterías de ejemplo: "Café La Molienda" y una segunda para probar el aislamiento entre cafeterías.
- Las cuentas de empleado y propietario de prueba no se pueden crear sin usuarios reales. Tras el registro te propongo asignarte el rol de propietario de La Molienda, o crear usuarios de prueba desde el panel de Usuarios.
- Las páginas que aún no están conectadas siguen en "Modo demostración".

## 6. Lo que no se incluye

Pagos, notificaciones, Wallet ni Supabase externo.

## Detalles técnicos

- Una sola migración: tipo de rol, las tablas con sus GRANT, RLS y políticas, funciones `SECURITY DEFINER` y un trigger de perfil en `auth.users`.
- Funciones SQL `register_purchase` y `redeem_reward` con `SELECT ... FOR UPDATE`, invocadas desde `createServerFn` con `requireSupabaseAuth`. Se revoca `EXECUTE` a `anon`.
- Pruebas automáticas para: 8 sellos generan una recompensa, una clave repetida no duplica y un canje sin recompensa falla.
