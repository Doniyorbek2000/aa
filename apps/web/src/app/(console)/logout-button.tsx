'use client';

export function LogoutButton() {
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.assign('/login');
  };
  return (
    <button type="button" className="btn btn-ghost btn-small" onClick={() => void logout()}>
      Chiqish
    </button>
  );
}
