export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  speciality?: string;
  practicePlace?: string;
  avatar?: string;
}

// Default dummy users available locally
export const DUMMY_USERS: User[] = [
  {
    id: 'user-1',
    fullName: 'dr. Ridwan Setiawan',
    phone: '081234567890',
    email: 'ridwan@kalbe.co.id',
    speciality: 'DSA',
    practicePlace: 'RSIA Bunda Jakarta',
    avatar: '/assets/docter-avatar.png',
  },
  {
    id: 'user-2',
    fullName: 'dr. Sarah Amanda, Sp.A',
    phone: '081298765432',
    email: 'sarah@kalbe.co.id',
    speciality: 'PPDS',
    practicePlace: 'RS Cipto Mangunkusumo',
    avatar: '/assets/docter-avatar.png',
  },
  {
    id: 'user-3',
    fullName: 'dr. Budi Pratama',
    phone: '081122334455',
    email: 'budi@kalbe.co.id',
    speciality: 'GP',
    practicePlace: 'Klinik Medika Sehat',
    avatar: '/assets/docter-avatar.png',
  },
];

const STORAGE_KEY_AUTH = 'kalbe_auth_user';
const STORAGE_KEY_REGISTERED_USERS = 'kalbe_registered_users';

export const getRegisteredUsers = (): User[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_REGISTERED_USERS);
    if (stored) {
      const parsed = JSON.parse(stored) as User[];
      return [...DUMMY_USERS, ...parsed];
    }
  } catch (err) {
    console.error('Failed to read registered users from localStorage:', err);
  }
  return DUMMY_USERS;
};

export const saveRegisteredUser = (user: User): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_REGISTERED_USERS);
    const existing: User[] = stored ? JSON.parse(stored) : [];
    existing.push(user);
    localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save registered user to localStorage:', err);
  }
};

const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) {
    return '0' + digits.slice(2);
  }
  return digits;
};

export const authenticateUser = (
  phoneInput: string,
  emailInput: string
): { success: boolean; user?: User; error?: string } => {
  const cleanPhone = normalizePhone(phoneInput.trim());
  const cleanEmail = emailInput.trim().toLowerCase();

  if (!cleanPhone || !cleanEmail) {
    return {
      success: false,
      error: 'Nomor telepon dan email harus diisi.',
    };
  }

  const allUsers = getRegisteredUsers();
  const matchedUser = allUsers.find((u) => {
    const userPhoneClean = normalizePhone(u.phone);
    const userEmailClean = u.email.trim().toLowerCase();
    return userPhoneClean === cleanPhone && userEmailClean === cleanEmail;
  });

  if (!matchedUser) {
    return {
      success: false,
      error: 'Nomor telepon atau email tidak cocok dengan data pengguna.',
    };
  }

  try {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(matchedUser));
  } catch (err) {
    console.error('Failed to save current user session:', err);
  }

  return {
    success: true,
    user: matchedUser,
  };
};

export const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_AUTH);
    if (stored) {
      return JSON.parse(stored) as User;
    }
  } catch (err) {
    console.error('Failed to read current user:', err);
  }
  // Default fallback user matching the mockup if none logged in
  return DUMMY_USERS[0];
};

export const logoutUser = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  } catch (err) {
    console.error('Failed to remove auth user:', err);
  }
};
