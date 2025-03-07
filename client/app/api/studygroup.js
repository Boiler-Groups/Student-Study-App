import axios from 'axios';
import Constants from 'expo-constants';

const SERVER_URL = process.env.API_URL;

const StudyGroupClient = axios.create({
  baseURL: `${SERVER_URL}/studygroups`,
  timeout: 5000,
});

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getStudyGroups = ({ email }) => StudyGroupClient.get(`/${email}`);

export const getStudyGroupsAll = () => StudyGroupClient.get('/groups');

export const createStudyGroup = (studyGroupData) => StudyGroupClient.post('/', studyGroupData);

export const deleteStudyGroup = (studyGroupId) => StudyGroupClient.delete(`/id/${studyGroupId}`);

export const editStudyGroupName = (id, newName) => StudyGroupClient.patch(`/editName/${id}`, newName );

// Function to add member emails to a study group
export const addStudyGroupMembers = (id, email) => StudyGroupClient.patch(`/id/${id}/members`, {email});

export const getGroupMessages = (token, groupId) =>
  StudyGroupClient.get(`/messages/${groupId}`, authHeader(token))
    .then(res => res.data)
    .catch(err => {
      console.error("Error fetching messages:", err);
      return [];
    });

export const sendMessage = (token, groupId, message) =>
  StudyGroupClient.post(`/messages/${groupId}`, { text: message }, authHeader(token))
    .then(res => res.data)
    .catch(err => {
      console.error("Error sending message:", err);
      return null;
    });

export const getGroupMembers = (token, groupId) =>
  StudyGroupClient.get(`/members/${groupId}`, authHeader(token))
    .then(res => res.data)
    .catch(err => {
      console.error("Error fetching messages:", err);
      return [];
    });
