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
<<<<<<< HEAD
});
=======
    });

export const searchUser = (query) => UserClient.get('/search', { params: { query } });

export const getUserFromId = (userId) => UserClient.get(`/${userId}`);
>>>>>>> 9f89eb8dcc413c173c79f70ba16770d059dda6ee
