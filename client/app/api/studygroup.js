import axios from 'axios';
import Constants from 'expo-constants';

const SERVER_URL = Constants.expoConfig?.extra?.serverUrl || process.env.API_URL;

const StudyGroupClient = axios.create({
  baseURL: `${SERVER_URL}/studygroups`,
  timeout: 5000,
});

export const getStudyGroups = ({ email }) => StudyGroupClient.get(`/${email}`);

export const getStudyGroupsAll = () => StudyGroupClient.get('/groups');

export const createStudyGroup = (studyGroupData) => StudyGroupClient.post('/', studyGroupData);

export const deleteStudyGroup = (studyGroupId) => StudyGroupClient.delete(`/id/${studyGroupId}`);

export const editStudyGroupName = (id, newName) => StudyGroupClient.patch(`/editName/${id}`, newName );

// Function to add member emails to a study group
export const addStudyGroupMembers = (id, email) => StudyGroupClient.patch(`/id/${id}/members`, {email});