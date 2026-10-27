# Pruebas reales de Loop (Supabase E2E)

Estas pruebas **no** se ejecutan con el CI normal. Crean seis usuarios ficticios, tres tarjetas, registran compras, realizan canjes y comprueban aislamiento entre dos cafeterías. Utilizan una clave `service_role` para crear usuarios y limpiar registros; por tanto, **solo deben ejecutarse en un proyecto Supabase aislado, nunca en producción ni en Lovable Cloud con clientes reales**.

## Preparación
1. Crear un proyecto Supabase exclusivo para pruebas, sin clientes ni datos reales, con el esquema, RLS y funciones SQL equivalentes a Loop.
2. Crear dos cafeterías de prueba con slugs exactos `la-molienda` y `tueste-norte`.
3. En GitHub, configurar el entorno `loop-e2e` con aprobación requerida, y sus secretos:
   - `LOOP_E2E_SUPABASE_URL` (URL del proyecto de pruebas)
   - `LOOP_E2E_SUPABASE_PUBLISHABLE_KEY` (clave pública)
   - `LOOP_E2E_SUPABASE_SERVICE_ROLE_KEY` (clave privada de pruebas, **nunca** poner en frontend, chats o commits)
4. Una vez integrado el workflow a `main`, ir a **Actions → Loop checks → Run workflow**, seleccionar la rama deseada y activar `run_database_e2e`. Aprobar el entorno si corresponde.
5. Revisar los logs: debe finalizar con cero pruebas fallidas y cero errores de limpieza. Después verificar que no quedaron usuarios ni compras de prueba.

## Cobertura
- Alta y autenticación de clientes, empleados, propietario y empleado inactivo.
- RLS: clientes, anónimos, empleados y propietarios, incluido aislamiento entre cafeterías.
- Ocho compras → una recompensa; canje único y rechazo de segundo canje.
- Idempotencia de compras/canjes y envíos concurrentes.

## Limitaciones
- La ejecución requiere configuración manual del proyecto aislado y secretos.
- La prueba es de API/base de datos, **no** valida botones, navegación, QR ni experiencia de usuario en navegador.
- Los slugs de prueba y la base de datos deben estar preparados antes de ejecutar.
- Un error de red o de limpieza puede dejar datos de prueba; revisar el proyecto aislado.
