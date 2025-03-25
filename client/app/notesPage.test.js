import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NotesPage from './notesPage'; // adjust path if needed
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_URL, GEMINI_API_KEY } from '@env';

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

describe('NotesPage Flashcard Generation', () => {
  it('creates a text file when "Make Flash Cards" is pressed', async () => {
    const { getByText, getAllByText, queryByText } = render(<NotesPage />);

    // Wait for UI to settle (API calls, etc.)
    await waitFor(() => {
      expect(getByText('Your Notes')).toBeTruthy();
    });

    // Open the "Add Note" modal
    fireEvent.press(getByTestId('add-btn'));

    // Fill in the note (name + content)
    fireEvent.changeText(getByText('Note Name'), 'Test Note');
    fireEvent.changeText(getByText('Write in your notes here....'), 'These are some test notes.');

    // Save note
    fireEvent.press(getByText('Create Note'));

    // Wait for it to appear
    await waitFor(() => expect(queryByText('Test Note')).toBeTruthy());

    // Open flashcard modal (simulate flashcard icon press)
    fireEvent.press(getAllByText('Test Note')[0].parent.parent.children[3]); // assumes 4th button is the flash icon

    // Pick flashcard number
    fireEvent.press(getByText('Select number'));
    fireEvent.press(getByText('Cards: 1'));

    // Press Make Flash Cards
    fireEvent.press(getByText('Make Flash Cards'));

    await waitFor(() => {
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringMatching(/flashcards_\d+\.txt/),
        'Mock flashcard content',
        { encoding: 'utf8' }
      );
    });
  });
});
