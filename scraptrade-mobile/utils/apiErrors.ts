import type { AxiosError } from 'axios';

type ApiErrorBody = {
  message?: string;
  error?: string;
};

function isAxiosError(error: unknown): error is AxiosError<ApiErrorBody> {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}

function readServerMessage(error: AxiosError<ApiErrorBody>): string | null {
  const message = error.response?.data?.message;
  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }

  const fallback = error.response?.data?.error;
  if (typeof fallback === 'string' && fallback.trim()) {
    return fallback.trim();
  }

  return null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (!isAxiosError(error)) {
    return fallback;
  }

  const serverMessage = readServerMessage(error);
  if (serverMessage) {
    return serverMessage;
  }

  if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
    return 'Request timed out. Check your connection and try again.';
  }

  if (!error.response) {
    return 'Could not reach the server. Check your internet connection and API URL.';
  }

  switch (error.response.status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Invalid email or password.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'The requested item was not found.';
    case 409:
      return 'This action conflicts with existing data. Please review and try again.';
    case 422:
      return 'Please check your input and try again.';
    case 500:
    case 502:
    case 503:
      return 'Server error. Please try again later.';
    default:
      return fallback;
  }
}

export function isDuplicateEmailMessage(message: string): boolean {
  return /already exists|already registered|email.*(taken|in use)/i.test(message);
}

export function parseRegisterError(error: unknown): {
  formError: string;
  emailError?: string;
} {
  const formError = getApiErrorMessage(error, 'Could not create account.');
  if (isDuplicateEmailMessage(formError)) {
    return {
      formError,
      emailError: 'This email is already registered. Sign in or use a different email.',
    };
  }
  return { formError };
}

export type LoginErrorResult = {
  formError: string;
  passwordError?: string;
  suggestForgotPassword?: boolean;
  suggestSignUp?: boolean;
};

export function parseLoginError(error: unknown): LoginErrorResult {
  const message = getApiErrorMessage(error, 'Could not sign in. Check your email and password.');

  if (/password is required/i.test(message)) {
    return {
      formError: '',
      passwordError: 'Enter your password to sign in.',
    };
  }

  if (/does not have a password|forgot password to create/i.test(message)) {
    return {
      formError: message,
      suggestForgotPassword: true,
    };
  }

  if (/invalid email or password/i.test(message)) {
    return {
      formError:
        'Email or password is incorrect. If you have not set a password yet, tap Forgot? below.',
      suggestForgotPassword: true,
    };
  }

  if (/email is required/i.test(message)) {
    return { formError: message, passwordError: undefined };
  }

  return { formError: message };
}

export function parseForgotPasswordError(error: unknown): string {
  return getApiErrorMessage(error, 'Could not send reset instructions. Please try again.');
}

export function parseResetPasswordError(error: unknown): {
  formError: string;
  tokenExpired?: boolean;
} {
  const formError = getApiErrorMessage(error, 'Could not reset password. Please try again.');
  const tokenExpired = /invalid or expired reset token|reset token is required/i.test(formError);
  return { formError, tokenExpired };
}
