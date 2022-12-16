import Controller from '@/utils/interfaces/controllerInterface';
import { Router, Request, Response } from 'express';
import z, { string } from 'zod';
import bauth from '@/utils/bauth/bauth';
import generateToken from '@/utils/Auth/jwt.auth';

class LoginController implements Controller {
    public path = '/login';
    public router: Router;

    constructor() {
        this.router = Router();
    }

    public async initialiseRoutes(): Promise<void> {
        this.router.post(`${this.path}`, this.login);
    }

    private async login(req: Request, res: Response): Promise<any> {
        try {
            const loginUser = z.object({
                email: string().email(),
                senha: string(),
            });

            const { email, senha } = loginUser.parse(req.body);

            const responseLogin = await bauth.post('/login', {
                email: email,
                senha: senha,
            });

            const { token, user } = await responseLogin.data;

            bauth.defaults.headers.common = {
                Authorization: `bearer ${token}`,
            };

            const responseTokenUser = await bauth.get('/user');

            const userFromToken = responseTokenUser.data;

            if (user._id === userFromToken._id) {
                const bauth_token = generateToken({ id: userFromToken._id });
                return res.status(200).json({
                    bauth_token,
                    user,
                });
            } else {
                return res.status(401).json({
                    message: 'Unable to create bauth',
                });
            }
        } catch (error) {
            return res.status(400).json({ message: 'Ocorreu um erro' });
        }
    }
}

export default LoginController;
