# CaféLoop roadmap

- [ ] Backend v1: cafés, roles por cafetería, tarjetas de 8 sellos, compras, sellos y canjes con RLS
- [ ] Códigos de tarjeta aleatorios y únicos
- [ ] Funciones SQL que verifican identidad y membresía activa; EXECUTE mínimo
- [ ] Idempotencia por operación y cafetería; clave reutilizada con datos distintos = error
- [ ] Compras manuales marcadas como "confirmación del empleado"
- [ ] Autenticación (correo/contraseña + Google), recuperación de contraseña
- [ ] Conectar tarjeta, empleados y propietario al backend
- [ ] Pruebas: aislamiento, acceso no autorizado, manipulación desde navegador, concurrencia, canje duplicado
- [ ] Datos ficticios (dos cafeterías)
- No publicar ni usar datos personales reales todavía
