import axios from 'axios';
import Constants from 'expo-constants';

const SERVER_URL = Constants.expoConfig?.extra?.serverUrl || process.env.API_URL;

const StudyGroupClient = axios.create({
  baseURL: `${SERVER_URL}/studygroups`,
  timeout: 5000,
});

export const getStudyGroups = ({ email }) => StudyGroupClient.get(`/${email}`);

export const createStudyGroup = (studyGroupData) => StudyGroupClient.post('/', studyGroupData);

export const deleteStudyGroup = (studyGroupId) => StudyGroupClient.delete(`/id/${studyGroupId}`);
