import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NotesPage from '../app/notesPage'; // adjust path if needed
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_URL, GEMINI_API_KEY } from '@env';
import { NavigationContainer } from '@react-navigation/native';

//IOS environment
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (options) => options.ios,
}));


// Mock FileSystem & Sharing
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  writeAsStringAsync: jest.fn(),
  EncodingType: { UTF8: 'utf8' },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.mock('@env', () => ({
  API_URL: 'https://mock-api.com',
}));

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: async () => ({
          response: {
            text: async () => 'Mock Flashcard Content',
          },
        }),
      }),
    })),
    HarmCategory: {},
    HarmBlockThreshold: {},
  };
});
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([{ _id: 'mock-id-1', name: 'Test Note', content: 'Some notes here...' }]),
  })
);
global.alert = jest.fn();

describe('NotesPage Flashcard Generation', () => {
  it('creates a text file when "Make Flash Cards" is pressed', async () => {
    const { getByText, getAllByText, queryByText, getByTestId } = render(
      <NavigationContainer>
        <NotesPage />
      </NavigationContainer>
    );
    

    // Wait for UI to settle (API calls, etc.)
    await waitFor(() => {
      expect(getByText('Your Notes')).toBeTruthy();
    });

    // Open the "Add Note" modal
    fireEvent.press(getByTestId('add-btn'));

    // Fill in the note (name + content)
    fireEvent.changeText(getByTestId('note-name'), 'Test Note');
    fireEvent.changeText(getByTestId('write-note'), 'These are some test notes.');

    // Save note
    fireEvent.press(getByText('Create Note'));
    
    await waitFor(() => expect(queryByText('Create a Note')).toBeNull());
    await waitFor(() => expect(queryByText('Test Note')).toBeTruthy());

    // Open flashcard modal (simulate flashcard icon press)
    fireEvent.press(getByTestId('test-btn-Test Note')); // assumes 4th button is the flash icon

    // Pick flashcard number
    fireEvent.press(getByText('Select number'));
    fireEvent.press(getByText('Cards: 1'));

    // Press Make Flash Cards
    fireEvent.press(getByText('Make Flash Cards'));

    await waitFor (() => {
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringMatching(/flashcards_\d+\.txt/),
        'Mock Flashcard Content',
        { encoding: 'utf8' }
      );    
    });
  });
});
