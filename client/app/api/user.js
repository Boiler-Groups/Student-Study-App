import axios from "axios";

const SERVER_URL = process.env.API_URL;

const UserClient = axios.create({
    baseURL: `${SERVER_URL}/users`,
    timeout: 5000,
});

export const getCurrentUser = ({ token }) =>
    UserClient.get("/me", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

export const searchUser = (query) => UserClient.get('/search', { params: { query } });

export const getUserFromId = (userId) => UserClient.get(`/${userId}`);

export const updateUserPoints =  (userId, newPoints) => UserClient.put(`/points/${userId}`, {points: newPoints});
export const getUserPoints =  (userId) => UserClient.get(`/points/${userId}`);

export const setOnlineStatus = async (userId, online, token) => {
    return UserClient.patch(`/${userId}/online`, { online }, {
        headers: { Authorization: `Bearer ${token}` },
    });
};
  
export const updateShowOnlineStatus = async (userId, showOnlineStatus, token) => {
    return UserClient.patch(`/${userId}/settings`, { showOnlineStatus }, {
        headers: { Authorization: `Bearer ${token}` },
    });
};
  
export const fetchOnlineAvatars = async () => {
    const res = await fetch(`${SERVER_URL}/users/online-avatars`);
    return res.json();
};
