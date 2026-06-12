function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Пароль не указан';
  if (password.length < 8) return 'Пароль должен содержать минимум 8 символов';
  if (!/[a-z]/.test(password)) return 'Пароль должен содержать хотя бы одну строчную латинскую букву';
  if (!/[A-Z]/.test(password)) return 'Пароль должен содержать хотя бы одну заглавную латинскую букву';
  if (!/\d/.test(password)) return 'Пароль должен содержать хотя бы одну цифру';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Пароль должен содержать хотя бы один спецсимвол';
  }
  return null;
}

module.exports = { validatePassword };
