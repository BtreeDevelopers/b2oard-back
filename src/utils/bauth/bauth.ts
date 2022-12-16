import axios from 'axios';

const bauth = axios.create({
    baseURL: String(process.env.AUTH_URL),
});

bauth.defaults.headers.common = {
    secret: `${process.env.ALLOWED_APP}`,
};

export default bauth;
