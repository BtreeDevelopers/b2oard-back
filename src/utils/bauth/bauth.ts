import axios from 'axios';

export const bauth = axios.create({
    baseURL: String(process.env.AUTH_URL)
})