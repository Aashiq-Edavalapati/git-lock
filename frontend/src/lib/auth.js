export const getSession = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('gitlock_user');
  return user ? JSON.parse(user) : null;
};

export const login = (email, role, name) => {
  const user = { 
    id: 'user_' + Math.floor(Math.random() * 1000),
    email, 
    role, 
    name 
  };
  localStorage.setItem('gitlock_user', JSON.stringify(user));
  return user;
};

export const logout = () => {
  localStorage.removeItem('gitlock_user');
  window.location.href = '/login';
};