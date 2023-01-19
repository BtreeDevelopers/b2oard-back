import Controller from '@/utils/interfaces/controllerInterface';
import { Router, Request, Response } from 'express';
import z, { string } from 'zod';
import { bauth } from '@/utils/bauth/bauth';
import generateToken from '@/utils/Auth/jwt.auth';
import mongoose from 'mongoose';
import cardModel from '@/resources/models/cardModel';
import boardModel from '@/resources/models/boardModel';
import favoritesModel from '@/resources/models/favoritesModel';
import raiaModel from '@/resources/models/raiaModel';

class LoginController implements Controller {
    public path = '/login';
    public router: Router;

    constructor() {
        this.router = Router();
    }

    public async initialiseRoutes(): Promise<void> {
        this.router.post(`${this.path}`, this.login);
        this.router.delete(`${this.path}/:userid`, this.delete);
    }

    private async login(req: Request, res: Response): Promise<any> {
        try {
            const loginUser = z.object({
                token: string(),
                userId: string(),
            });

            const { token, userId } = loginUser.parse(req.body);

            bauth.defaults.headers.common = {
                Authorization: `bearer ${token}`,
            };

            const responseTokenUser = await bauth.get('/user');

            const user = responseTokenUser.data;

            if (user._id === userId) {
                const token_bjrd = generateToken({ id: userId });
                return res.status(200).json({
                    token_bjrd,
                    _id: user._id,
                    nome: user.nome,
                    email: user.email,
                    bauth_token: token,
                    imagemUrl: user.imagemUrl,
                });
            } else {
                return res.status(401).json({
                    message: 'Unable to create bauth',
                });
            }
        } catch (error: any) {
            console.log(error);
            return res.status(400).json({ message: 'Ocorreu um erro' });
        }
    }
    private async delete(req: Request, res: Response): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userid = req.params.userid;

            const board_proprietario = await boardModel.find({ owner: userid });
            const ids_board_proprietario_deletar: string[] = [];
            const ids_board_proprietario_transferencia: string[] = [];

            board_proprietario.forEach((element) => {
                // se há apenas um followers ele é o dono do board, logo não há quem promover a dono
                if (element.followers.length === 1) {
                    ids_board_proprietario_deletar.push(...element._id);
                } else {
                    ids_board_proprietario_transferencia.push(...element._id);
                }
            });

            //apagando os boards em que é proprietário
            const raias_proprietario_deletar = await raiaModel.find({
                board: { $in: ids_board_proprietario_deletar },
            });

            const ids_cards_proprietario_deletar: string[] = [];

            raias_proprietario_deletar.forEach((element) => {
                element.cards.forEach((element_card) => {
                    ids_cards_proprietario_deletar.push(element_card);
                });
            });

            await cardModel.deleteMany({
                _id: { $in: ids_cards_proprietario_deletar },
            });
            await raiaModel.deleteMany({
                board: { $in: ids_board_proprietario_deletar },
            });
            await boardModel.deleteMany({
                _id: { $in: ids_board_proprietario_deletar },
            });

            //removendo do favoritos dos boards que era dono e mudando a propriedade
            const board_proprietario_transferencia = await boardModel.find({
                _id: { $in: ids_board_proprietario_transferencia },
            });

            await boardModel.updateMany(
                { _id: { $in: ids_board_proprietario_transferencia } },
                {
                    $pull: { followers: userid },
                }
            );

            const newOwner: { _id: string; owner: string }[] = [];
            board_proprietario_transferencia.forEach((element) => {
                newOwner.push({
                    _id: element._id,
                    owner:
                        element.followers[0] !== userid
                            ? element.followers[0]
                            : element.followers[1],
                });
            });

            for (let i = 0; i < newOwner.length; i++) {
                boardModel.updateOne(
                    { _id: newOwner[i]._id },
                    {
                        $set: { owner: newOwner[i].owner },
                    }
                );
            }

            //apagando favoritos
            await favoritesModel.findOneAndDelete({
                userId: userid,
            });

            //removendo dos boards do qual não é dono o seguir
            await boardModel.updateMany(
                {},
                {
                    $pull: { followers: userid },
                }
            );

            await cardModel.updateMany(
                {},
                {
                    $pull: { followers: userid },
                }
            );

            await session.commitTransaction();
            return res.status(200).json({ board_proprietario });
        } catch (error) {
            console.log(error);
            await session.abortTransaction();
            return res.status(500).json(error);
        } finally {
            session.endSession();
        }
    }
}

export default LoginController;
