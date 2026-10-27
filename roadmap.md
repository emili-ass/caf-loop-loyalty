# CaféLoop roadmap

- [x] Backend v1: cafés, roles por cafetería, tarjetas de 8 sellos, compras, sellos y canjes con RLS
- [x] Códigos de tarjeta aleatorios y únicos
- [x] Funciones SQL que verifican identidad y membresía activa; EXECUTE mínimo
- [x] Idempotencia por operación y cafetería; clave reutilizada con datos distintos = error
- [x] Compras manuales marcadas como "confirmación del empleado"
- [x] Autenticación (correo/contraseña + Google), recuperación de contraseña
- [x] Conectar tarjeta, empleados y propietario al backend
- [x] Pruebas: aislamiento, acceso no autorizado, manipulación desde navegador, concurrencia, canje duplicado
- [x] Datos ficticios (dos cafeterías)
- No publicar ni usar datos personales reales todavía
