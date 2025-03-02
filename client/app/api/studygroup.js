import axios from 'axios';
import Constants from 'expo-constants';

const SERVER_URL = Constants.expoConfig?.extra?.serverUrl || process.env.EXPO_PUBLIC_SERVER_URL;

const StudyGroupClient = axios.create({
  baseURL: `${SERVER_URL}/api/studygroup`,
  timeout: 5000,
});

export const getStudyGroups = ({ email }) => StudyGroupClient.get(`/${email}`);

