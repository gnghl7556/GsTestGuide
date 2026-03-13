export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const isValidPhone = (v: string) => /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(v);

export const isValidUrl = (v: string) => {
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
};
