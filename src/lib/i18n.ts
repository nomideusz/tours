import { writable, type Writable } from 'svelte/store';

// Define language type
export type Language = 'en';

// Define translation structure types
export interface Translations {
  en: TranslationContent;
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
  }
};

// Supported languages
export const LANGUAGES: Language[] = ['en'];

// Initialize language - always English now
const initLang = (): Language => {
  return 'en';
};

export const language: Writable<Language> = writable<Language>(initLang());

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