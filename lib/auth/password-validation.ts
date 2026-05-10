export const PASSWORD_HINT =
  "Use letras minúsculas, maiúsculas, dígitos e símbolos (ex: @, #, !).";

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "A senha deve ter no mínimo 8 caracteres.";
  if (!/[a-z]/.test(password)) return "A senha deve conter pelo menos uma letra minúscula.";
  if (!/[A-Z]/.test(password)) return "A senha deve conter pelo menos uma letra maiúscula.";
  if (!/[0-9]/.test(password)) return "A senha deve conter pelo menos um número.";
  if (!/[^a-zA-Z0-9]/.test(password)) return "A senha deve conter pelo menos um símbolo (ex: @, #, !).";
  return null;
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return "As senhas não coincidem.";
  return null;
}
