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