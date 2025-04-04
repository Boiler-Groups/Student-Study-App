import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Leaderboard from '../app/leaderboard';
import * as userAPI from '../app/api/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

jest.mock('../app/api/user', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@react-navigation/native', () => ({
  useTheme: () => ({ isDarkTheme: false }),
}));

beforeEach(() => {
  jest.clearAllMocks();

  global.fetch = jest.fn((url) => {
    if (url.includes('/users')) {
      return Promise.resolve({
        ok: true,
        json: async () => [
          { _id: '1', username: 'alice', points: 100 },
          { _id: '2', username: 'bob', points: 90 },
        ],
      });
    }

    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  });
});

describe('Leaderboard', () => {
  it('renders the current user at the bottom with username and points', async () => {
    const mockUser = {
      data: {
        _id: 'abc123',
        username: 'testuser',
        points: 456,
      },
    };

    AsyncStorage.getItem.mockResolvedValue('fake-token');
    userAPI.getCurrentUser.mockResolvedValue(mockUser);

    const { getByTestId, getByText } = render(<Leaderboard />);

    await waitFor(() => {
      const userBox = getByTestId('userBox2');
      expect(userBox).toBeTruthy();
      expect(getByText(/User: testuser/)).toBeTruthy();
      expect(getByText(/456 pts/)).toBeTruthy();
    });
  });
});
