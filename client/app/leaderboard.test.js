import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Leaderboard from './leaderboard'; // adjust path to match your project
import * as ReactNative from 'react-native';

// Mock fetch 
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
  })
);
// simulate time passing
jest.useFakeTimers(); 

describe('Leaderboard', () => {
  it('refreshes leaderboard data once per day', async () => {
    const spy = jest.spyOn(global, 'fetch');

    render(<Leaderboard />);

    // Initial fetch
    expect(spy).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(24 * 60 * 60 * 1000);

    // CHeck second fetch
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
});