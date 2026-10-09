import initialDummyUsers from './dummyUsers.json';
import { sqliteInsertUser } from './sqliteDb';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  speciality?: string;
  practicePlace?: string;
  practiceAddress?: string;
  avatar?: string;
}

// Default dummy users available locally
export const DUMMY_USERS: User[] = initialDummyUsers;

const STORAGE_KEY_AUTH = 'kalbe_auth_user';
const STORAGE_KEY_REGISTERED_USERS = 'kalbe_registered_users';
const STORAGE_KEY_REMEMBER_ME = 'kalbe_remember_me';

export const isRememberMeActive = (): boolean => {
  try {
    const isRemembered = localStorage.getItem(STORAGE_KEY_REMEMBER_ME);
    const authUser = localStorage.getItem(STORAGE_KEY_AUTH);
    return isRemembered === 'true' && Boolean(authUser);
  } catch (err) {
    console.error('Failed to check remember me status:', err);
    return false;
  }
};

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

export const registerNewUser = (
  userData: Omit<User, 'id'>
): { success: boolean; user?: User; error?: string } => {
  try {
    const cleanPhone = normalizePhone(userData.phone);
    const cleanEmail = userData.email.trim().toLowerCase();

    if (!cleanPhone) {
      return { success: false, error: 'Nomor telepon tidak valid.' };
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Format email tidak valid.' };
    }

    const allUsers = getRegisteredUsers();

    // Check if phone or email is already registered
    const isPhoneTaken = allUsers.some(
      (u) => normalizePhone(u.phone) === cleanPhone
    );
    if (isPhoneTaken) {
      return {
        success: false,
        error: 'Nomor telepon sudah terdaftar. Silakan gunakan nomor lain atau login.',
      };
    }

    const isEmailTaken = allUsers.some(
      (u) => u.email.trim().toLowerCase() === cleanEmail
    );
    if (isEmailTaken) {
      return {
        success: false,
        error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
      };
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      phone: cleanPhone,
      email: cleanEmail,
      avatar: userData.avatar || '/assets/docter-avatar.png',
    };

    // 1. Simpan di LocalStorage
    const stored = localStorage.getItem(STORAGE_KEY_REGISTERED_USERS);
    const existing: User[] = stored ? JSON.parse(stored) : [];
    existing.push(newUser);
    localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(existing));

    // 2. Simpan di Database Local SQLite
    sqliteInsertUser(newUser).catch((e) => {
      console.warn("Failed to insert user into SQLite database:", e);
    });

    return { success: true, user: newUser };
  } catch (err) {
    console.error('Failed to save registered user:', err);
    return { success: false, error: 'Terjadi kesalahan sistem saat mendaftar.' };
  }
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
  emailInput: string,
  rememberMe: boolean = false
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
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY_REMEMBER_ME, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_REMEMBER_ME);
    }

    // Khusus untuk user dummy (user@test.com), reset data aktivitas dan rewards saat login
    if (matchedUser.email.trim().toLowerCase() === 'user@test.com') {
      localStorage.removeItem('kalbe_rewards_user_test');
      localStorage.removeItem('kalbe_activities_user_test');
      localStorage.removeItem('kalbe_sympo_joined_user_test');
    }
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
    localStorage.removeItem(STORAGE_KEY_REMEMBER_ME);
  } catch (err) {
    console.error('Failed to remove auth user:', err);
  }
};
