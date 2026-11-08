import { toast } from "sonner";

// Supabase auto-confirms accounts when Confirm Email is disabled. A session
// returned directly from email/password signup means no email-link step occurred.
// Do not use user_metadata as proof of email ownership or as an access check.
export function notifyEmailAccess(
  user: { email_confirmed_at?: string | undefined },
  directSignup = false,
) {
  if (directSignup || !user.email_confirmed_at) {
    toast.warning("Entraste sin verificar el correo mediante un enlace", {
      id: "email-verification-notice",
      description:
        "Puedes usar Loop. En este acceso no se comprobó que tengas acceso a ese correo.",
      position: "top-right",
      duration: 9000,
      closeButton: true,
    });
  }
}
