import axios from 'axios';
import Constants from 'expo-constants';

const SERVER_URL = process.env.API_URL;

const StudyGroupClient = axios.create({
  baseURL: `${SERVER_URL}/studygroups`,
  timeout: 15000,
});

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getStudyGroups = ({ email }) => StudyGroupClient.get(`/${email}`);

export const getGroup = (token, groupId) => StudyGroupClient.get(`/group/${groupId}`, authHeader(token));

export const checkIsDM = (groupId) => StudyGroupClient.get(`/dm/${groupId}`);

export const getStudyGroupsAll = () => StudyGroupClient.get('/groups');

export const createStudyGroup = (studyGroupData) => StudyGroupClient.post('/', studyGroupData);

export const deleteStudyGroup = (studyGroupId) => StudyGroupClient.delete(`/id/${studyGroupId}`);

export const editStudyGroupName = (id, newName) => StudyGroupClient.patch(`/editName/${id}`, newName);

export const setNewMessageFlagForGroup = (groupId, newMessage) => StudyGroupClient.patch(`/setNewMessageFlag/${groupId}`, { newMessage });

export const addAllMembersToUnopenedMessageGroup = (groupId) => StudyGroupClient.put(`/addAllMembersToUnopenedMessageGroup/${groupId}`);

export const removeMemberFromUnopenedMessageGroup = (groupId, email) => StudyGroupClient.patch(`/removeMemberFromUnopenedMessageGroup/${groupId}/${email}`);

export const getMembersWithUnopenedMessages = (groupId) => StudyGroupClient.get(`/getMembersWithUnopenedMessages/${groupId}`);

export const getStudyGroupName = (groupId) => StudyGroupClient.get(`/name/${groupId}`);

export const addTaggedOrRepliedUser = (groupId, email) => StudyGroupClient.post(`/addTaggedUser/${groupId}`, { email });

export const removeTaggedOrRepliedUser = (groupId, email) => StudyGroupClient.patch(`/removeTaggedUser/${groupId}/${email}`);

export const getTaggedOrRepliedUsers = (groupId) => StudyGroupClient.get(`/getTaggedUsers/${groupId}`);

// Function to add member emails to a study group
export const addStudyGroupMembers = (id, email) => StudyGroupClient.patch(`/addMember/${id}`, { email });

export const deleteMessage = (token, groupId, messageId) => StudyGroupClient.patch(`/delete/${groupId}`, { messageId }, authHeader(token))

export const getGroupMessages = (token, groupId) =>
  StudyGroupClient.get(`/messages/${groupId}`, authHeader(token))
    .then(res => res.data)
    .catch(err => {
      console.error("Error fetching messages:", err);
      return [];
    });

export const sendMessage = (token, groupId, message, replyData = null) => {
  const payload = { text: message };

  if (replyData) {
    payload.replyToId = replyData.replyToId;
    payload.replyToSender = replyData.replyToSender;
    payload.replyToText = replyData.replyToText;
  }

  return StudyGroupClient.post(`/messages/${groupId}`, payload, authHeader(token))
    .then(async res => {
      if (replyData && replyData.replyToSender) {
        try {
          const messages = await getGroupMessages(token, groupId);
          const originalMessage = messages.find(msg => msg._id === replyData.replyToId);

          if (originalMessage) {
            const allMembers = await StudyGroupClient.get(`/members/${groupId}`, authHeader(token));

            const memberEmail = allMembers.data.find(member => {
              const emailUsername = member.includes('@') ? member.split('@')[0] : '';

              return emailUsername.toLowerCase() === replyData.replyToSender.toLowerCase();
            });

            console.log("Member email found for reply:", memberEmail);

            if (memberEmail) {
              await addTaggedOrRepliedUser(groupId, memberEmail);
            }
          }
        } catch (err) {
          console.error("Error adding replied user to notifications:", err);
        }
      }

      return res.data;
    })
    .catch(err => {
      console.error("Error sending message:", err);
      return null;
    });
}

export const likeMessage = (token, groupId, message) => StudyGroupClient.post(`/react/${groupId}`, { messageId: message }, authHeader(token));

export const toggleMessageLike = (token, groupId, message) => StudyGroupClient.post(`/toggleLike/${groupId}`, { messageId: message, isLike: true }, authHeader(token));

export const toggleMessageDislike = (token, groupId, message) => StudyGroupClient.post(`/toggleLike/${groupId}`, { messageId: message, isLike: false }, authHeader(token));

export const getGroupMembers = (token, groupId) =>
  StudyGroupClient.get(`/members/${groupId}`, authHeader(token))
    .then(res => res.data)
    .catch(err => {
      console.error("Error fetching messages:", err);
      return [];
    });

export const removeMember = (token, groupId, userEmail) =>
  StudyGroupClient.patch(`/remove/${groupId}`, { email: userEmail }, authHeader(token))
    .then(res => res.data)
    .catch(err => {
      console.error("Error remove user from group:", err);
      return null;
    });

export const edbotResponse = (token, groupId, text, edbotName, edbotPersonality) => StudyGroupClient.post(`/edbot/${groupId}`, { text: text, edbotName, edbotPersonality }, authHeader(token));

export const edbotSettings = (token, groupId, edbotPersonality, edbotName, edbotEnabled) =>
  StudyGroupClient.patch(`/edbotSettings/${groupId}`, { edbotEnabled, edbotName, edbotPersonality }, authHeader(token));