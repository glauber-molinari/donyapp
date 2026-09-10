export const AUTH_STRENGTH_HINT =
  "Use letras minúsculas, maiúsculas, dígitos e símbolos (ex: @, #, !).";

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "A senha deve ter no mínimo 8 caracteres.";
  if (!/[a-z]/.test(password)) return "A senha deve conter pelo menos uma letra minúscula.";
  if (!/[A-Z]/.test(password)) return "A senha deve conter pelo menos uma letra maiúscula.";
  if (!/[0-9]/.test(password)) return "A senha deve conter pelo menos um número.";
  if (!/[^a-zA-Z0-9]/.test(password)) return "A senha deve conter pelo menos um símbolo (ex: @, #, !).";
  return null;
}

function stringsMatchConstantTime(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  const len = Math.max(left.length, right.length);
  let diff = left.length === right.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (!stringsMatchConstantTime(password, confirm)) return "As senhas não coincidem.";
  return null;
}
