/** Only allow same-origin absolute paths, including values restored from storage. */
export function safeAuthPath(value?: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    Array.from(value).some((char) => char === "\\" || char.charCodeAt(0) <= 32)
  )
    return "/tarjeta";
  try {
    const target = new URL(value, "https://loop.invalid");
    return target.origin === "https://loop.invalid"
      ? target.pathname + target.search + target.hash
      : "/tarjeta";
  } catch {
    return "/tarjeta";
  }
}
