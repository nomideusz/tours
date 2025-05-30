import { writable, type Writable } from 'svelte/store';

// Define language type
export type Language = 'en' | 'pl';

// Define translation structure types
export interface Translations {
  en: TranslationContent;
  pl: TranslationContent;
}

export interface TranslationContent {
  appName: string;
  appDescription: string;
  nav: {
    main: string;
    dashboard: string;
    tests: string;
    reports: string;
    users: string;
    settings: string;
  };
  footer: {
    copyright: string;
    version: string;
  };
  auth: {
    login: string;
    logout: string;
    loggingOut: string;
    loading: string;
    title: string;
  };
  loading: {
    pageLoading: string;
  };

  loginPage: {
    title: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    loginButton: string;
    loggingIn: string;
    forgotPassword: string;
    pleaseWait: string;
    validation: {
      emailRequired: string;
      emailInvalid: string;
      passwordRequired: string;
    }
  };
  forgotPassword: {
    title: string;
    description: string;
    emailLabel: string;
    emailPlaceholder: string;
    sendButton: string;
    sending: string;
    backToLogin: string;
    pleaseWait: string;
    success: string;
    returnToLogin: string;
    validation: {
      emailRequired: string;
      emailInvalid: string;
    }
  };
  logout: {
    redirecting: string;
    error: string;
  };
  resetPassword: {
    title: string;
    description: string;
    invalidToken: string;
    requestNewLink: string;
    success: string;
    goToLogin: string;
    newPassword: string;
    newPasswordPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    passwordNote: string;
    setPasswordButton: string;
    settingPassword: string;
    backToLogin: string;
    pleaseWait: string;
    validation: {
      passwordRequired: string;
      passwordLength: string;
      confirmRequired: string;
      passwordsDoNotMatch: string;
    };
    error: string;
  };
  settings: {
    title: string;
    authRequired: string;
    login: string;
    profile: {
      title: string;
      username: string;
      email: string;
      emailNote: string;
      updateButton: string;
      updating: string;
      success: string;
      error: string;
    };
    password: {
      title: string;
      current: string;
      new: string;
      confirm: string;
      passwordNote: string;
      changeButton: string;
      changing: string;
      success: string;
      error: string;
      validationError: string;
    };
  };
}

// Translations for the application
export const translations: Translations = {
  en: {
    // Header
    appName: 'PSG Dashboard',
    appDescription: 'Tool for data management and analysis',

    // Navigation
    nav: {
      main: 'Main',
      dashboard: 'Dashboard',
      tests: 'Tests',
      reports: 'Reports',
      users: 'Users',
      settings: 'Settings',
    },
    // Footer
    footer: {
      copyright: '© {year} PSG Dashboard',
      version: 'Version'
    },

    // Auth
    auth: {
      login: 'Login',
      logout: 'Logout',
      loggingOut: 'Logging out...',
      loading: 'Loading...',
      title: 'PSG Dashboard'
    },

    // Loading
    loading: {
      pageLoading: 'Loading page...'
    },

    // Login Page
    loginPage: {
      title: 'Login',
      email: 'Email',
      emailPlaceholder: 'your@email.com',
      password: 'Password',
      passwordPlaceholder: 'Your password',
      loginButton: 'Login',
      loggingIn: 'Logging in...',
      forgotPassword: 'Forgot password?',
      pleaseWait: 'Please wait...',
      validation: {
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email address',
        passwordRequired: 'Password is required'
      }
    },

    // Forgot Password Page
    forgotPassword: {
      title: 'Reset Your Password',
      description: 'Enter your email address, and we\'ll send you instructions to reset your password.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email address',
      sendButton: 'Send Reset Instructions',
      sending: 'Sending...',
      backToLogin: 'Back to Login',
      pleaseWait: 'Please wait...',
      success: 'Password reset instructions have been sent to your email.',
      returnToLogin: 'Return to Login',
      validation: {
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email address'
      }
    },



    // Logout
    logout: {
      redirecting: 'Redirecting...',
      error: 'Failed to logout'
    },

    // Reset Password
    resetPassword: {
      title: 'Set New Password',
      description: 'Please enter and confirm your new password.',
      invalidToken: 'Invalid or missing reset token. Please request a new password reset link.',
      requestNewLink: 'Request New Link',
      success: 'Your password has been successfully reset!',
      goToLogin: 'Go to Login',
      newPassword: 'New Password',
      newPasswordPlaceholder: 'Enter your new password',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Confirm your new password',
      passwordNote: 'Must be at least 8 characters long.',
      setPasswordButton: 'Set New Password',
      settingPassword: 'Setting Password...',
      backToLogin: 'Back to Login',
      pleaseWait: 'Please wait...',
      validation: {
        passwordRequired: 'Password is required',
        passwordLength: 'Password must be at least 8 characters long',
        confirmRequired: 'Please confirm your password',
        passwordsDoNotMatch: 'Passwords do not match'
      },
      error: 'Failed to reset password'
    },

    // Settings
    settings: {
      title: 'Account Settings',
      authRequired: 'You must be logged in to access this page.',
      login: 'Login',
      profile: {
        title: 'Profile Information',
        username: 'Username',
        email: 'Email Address',
        emailNote: 'Email address cannot be changed.',
        updateButton: 'Update Profile',
        updating: 'Updating...',
        success: 'Profile updated successfully',
        error: 'Failed to update profile'
      },
      password: {
        title: 'Change Password',
        current: 'Current Password',
        new: 'New Password',
        confirm: 'Confirm New Password',
        passwordNote: 'Must be at least 8 characters long.',
        changeButton: 'Change Password',
        changing: 'Changing...',
        success: 'Password changed successfully',
        error: 'Failed to change password',
        validationError: 'New passwords do not match'
      }
    }
  },

  pl: {
    // Header
    appName: 'PSG Dashboard',
    appDescription: 'Narzędzie do zarządzania i analizy danych',

    // Navigation
    nav: {
      main: 'Główne',
      dashboard: 'Dashboard',
      tests: 'Testy',
      reports: 'Raporty',
      users: 'Użytkownicy',
      settings: 'Ustawienia',
    },

    // Footer
    footer: {
      copyright: '© {year} PSG Dashboard',
      version: 'Wersja'
    },

    // Auth
    auth: {
      login: 'Zaloguj',
      logout: 'Wyloguj',
      loggingOut: 'Wylogowywanie...',
      loading: 'Ładowanie...',
      title: 'PSG Dashboard'
    },

    // Loading
    loading: {
      pageLoading: 'Ładowanie strony...'
    },

    // Login Page
    loginPage: {
      title: 'Zaloguj się',
      email: 'Email',
      emailPlaceholder: 'twoj@email.com',
      password: 'Hasło',
      passwordPlaceholder: 'Twoje hasło',
      loginButton: 'Zaloguj',
      loggingIn: 'Logowanie...',
      forgotPassword: 'Zapomniałeś hasła?',
      pleaseWait: 'Proszę czekać...',
      validation: {
        emailRequired: 'Email jest wymagany',
        emailInvalid: 'Wprowadź prawidłowy adres email',
        passwordRequired: 'Hasło jest wymagane'
      }
    },

    // Forgot Password Page
    forgotPassword: {
      title: 'Zresetuj swoje hasło',
      description: 'Wprowadź swój adres email, a my wyślemy Ci instrukcje resetowania hasła.',
      emailLabel: 'Adres Email',
      emailPlaceholder: 'Wprowadź swój adres email',
      sendButton: 'Wyślij instrukcje resetowania',
      sending: 'Wysyłanie...',
      backToLogin: 'Powrót do logowania',
      pleaseWait: 'Proszę czekać...',
      success: 'Instrukcje resetowania hasła zostały wysłane na Twój email.',
      returnToLogin: 'Powrót do logowania',
      validation: {
        emailRequired: 'Email jest wymagany',
        emailInvalid: 'Wprowadź prawidłowy adres email'
      }
    },

    // Logout
    logout: {
      redirecting: 'Przekierowywanie...',
      error: 'Nie udało się wylogować'
    },

    // Reset Password
    resetPassword: {
      title: 'Ustaw nowe hasło',
      description: 'Wprowadź i potwierdź swoje nowe hasło.',
      invalidToken: 'Nieprawidłowy lub brakujący token resetowania. Proszę poprosić o nowy link resetowania hasła.',
      requestNewLink: 'Poproś o nowy link',
      success: 'Twoje hasło zostało pomyślnie zresetowane!',
      goToLogin: 'Przejdź do logowania',
      newPassword: 'Nowe hasło',
      newPasswordPlaceholder: 'Wprowadź swoje nowe hasło',
      confirmPassword: 'Potwierdź hasło',
      confirmPasswordPlaceholder: 'Potwierdź swoje nowe hasło',
      passwordNote: 'Musi mieć co najmniej 8 znaków.',
      setPasswordButton: 'Ustaw nowe hasło',
      settingPassword: 'Ustawianie hasła...',
      backToLogin: 'Powrót do logowania',
      pleaseWait: 'Proszę czekać...',
      validation: {
        passwordRequired: 'Hasło jest wymagane',
        passwordLength: 'Hasło musi mieć co najmniej 8 znaków',
        confirmRequired: 'Proszę potwierdzić hasło',
        passwordsDoNotMatch: 'Hasła nie są zgodne'
      },
      error: 'Nie udało się zresetować hasła'
    },

    // Settings
    settings: {
      title: 'Ustawienia konta',
      authRequired: 'Musisz być zalogowany, aby uzyskać dostęp do tej strony.',
      login: 'Zaloguj',
      profile: {
        title: 'Informacje o profilu',
        username: 'Nazwa użytkownika',
        email: 'Adres email',
        emailNote: 'Adres email nie może zostać zmieniony.',
        updateButton: 'Aktualizuj profil',
        updating: 'Aktualizowanie...',
        success: 'Profil został zaktualizowany pomyślnie',
        error: 'Nie udało się zaktualizować profilu'
      },
      password: {
        title: 'Zmień hasło',
        current: 'Aktualne hasło',
        new: 'Nowe hasło',
        confirm: 'Potwierdź nowe hasło',
        passwordNote: 'Musi mieć co najmniej 8 znaków.',
        changeButton: 'Zmień hasło',
        changing: 'Zmienianie...',
        success: 'Hasło zostało zmienione pomyślnie',
        error: 'Nie udało się zmienić hasła',
        validationError: 'Nowe hasła nie są zgodne'
      }
    }
  }
};

// Supported languages
export const LANGUAGES: Language[] = ['en', 'pl'];

// Initialize language from localStorage or use browser language or default to English
const initLang = (): Language => {
  if (typeof window !== 'undefined') {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && LANGUAGES.includes(savedLang)) {
      return savedLang;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'pl') {
      return 'pl';
    }
  }

  return 'en'; // Default to English
};

export const language: Writable<Language> = writable<Language>(initLang());

// Update localStorage when language changes
if (typeof window !== 'undefined') {
  language.subscribe((value: Language) => {
    localStorage.setItem('language', value);
  });
}

// Helper function to get translated text
export function t(key: string, lang: Language): string {
  const keys = key.split('.');
  let result: any = translations[lang];

  for (const k of keys) {
    if (result && result[k] !== undefined) {
      result = result[k];
    } else {
      return key; // Return the key if translation is missing
    }
  }

  // Handle special variables like {year}
  if (typeof result === 'string') {
    const yearStr = String(new Date().getFullYear());
    result = result.replace('{year}', yearStr);
  }

  return result;
} 