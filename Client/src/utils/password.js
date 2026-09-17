// src/utils/password.js

export const passwordRequirements = [
  {
    key: 'length',
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    key: 'uppercase',
    label: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    key: 'lowercase',
    label: 'One lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    key: 'number',
    label: 'One number',
    test: (password) => /[0-9]/.test(password),
  },
  {
    key: 'special',
    label: 'One special character',
    test: (password) =>
      /[!@#$%^&*(),.?":{}|<>\[\]\\/'`~_+=;-]/.test(password),
  },
  {
    key: 'spaces',
    label: 'No spaces',
    test: (password) => !/\s/.test(password),
  },
];

export const validateStrongPassword = (password) => {
  const value = String(password || '');

  if (value.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long.',
    };
  }

  if (value.length > 128) {
    return {
      valid: false,
      message: 'Password must not exceed 128 characters.',
    };
  }

  if (/\s/.test(value)) {
    return {
      valid: false,
      message: 'Password must not contain spaces.',
    };
  }

  if (!/[A-Z]/.test(value)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter.',
    };
  }

  if (!/[a-z]/.test(value)) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter.',
    };
  }

  if (!/[0-9]/.test(value)) {
    return {
      valid: false,
      message: 'Password must contain at least one number.',
    };
  }

  if (!/[!@#$%^&*(),.?":{}|<>\[\]\\/'`~_+=;-]/.test(value)) {
    return {
      valid: false,
      message: 'Password must contain at least one special character.',
    };
  }

  return {
    valid: true,
    message: 'Password is strong.',
  };
};

export const generateStrongPassword = () => {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%^&*_-+=';
  const all = uppercase + lowercase + numbers + special;

  const randomCharacter = (characters) => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return characters[array[0] % characters.length];
  };

  const characters = [
    randomCharacter(uppercase),
    randomCharacter(lowercase),
    randomCharacter(numbers),
    randomCharacter(special),
  ];

  while (characters.length < 12) {
    characters.push(randomCharacter(all));
  }

  // Shuffle
  for (let i = characters.length - 1; i > 0; i--) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const j = array[0] % (i + 1);

    [characters[i], characters[j]] = [characters[j], characters[i]];
  }

  return characters.join('');
};