export function isDuplicateUserError(error: { message?: string; code?: string } | null | undefined) {
  const text = `${error?.message || ''} ${error?.code || ''}`.toLowerCase();
  return /already registered|already been registered|already exists|user_already_exists|email_exists|duplicate/.test(
    text
  );
}

export function isExistingSignupUser(user: { identities?: Array<unknown> | null } | null | undefined) {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
}
