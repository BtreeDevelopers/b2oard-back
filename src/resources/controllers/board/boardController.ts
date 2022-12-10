import Controller from '@/utils/interfaces/controllerInterface';
import { Router, Request, Response } from 'express';
import auth from '@/middleware/auth.middleware';
import userModel from '@/resources/models/userModel';
import boardModel from '@/resources/models/boardModel';
import { boolean, string } from 'zod';
import z from 'zod';
import cardModel from '@/resources/models/cardModel';
import mongoose from 'mongoose';

class BoardController implements Controller {
    public path = '/board';
    public router: Router;

    constructor() {
        this.router = Router();
    }

    public async initialiseRoutes(): Promise<void> {
        /**
         * Criação de Boards
         */
        this.router.post(`${this.path}`, auth, this.createNewBoard);
        /**
         * Listar boards do usuário, o parametro filtra com all, fav, shared
         */
        this.router.get(`${this.path}/:id`, auth, this.listMyBoard);
        /**
         * Listar cards de um determinado board
         */
        this.router.get(`${this.path}/from/:id`, auth, this.getThisBoard);
        /**
         *
         */
        this.router.delete(`${this.path}/:id`, auth, this.deleteBoard);
    }

    private async createNewBoard(req: Request, res: Response): Promise<void> {
        try {
            const user = await userModel.findOne({ _id: req.userId });

            if (!user) {
                res.status(404).json({ message: 'User not found' });
            } else {
                const newBoard = z.object({
                    nome: string(),
                    cor: string(),
                    icon: string(),
                    favorito: boolean(),
                });

                const { nome, cor, icon, favorito } = newBoard.parse(req.body);

                const board = await boardModel.findOne({
                    nome: nome,
                    owner: user._id,
                });

                if (!board) {
                    const data = await boardModel.create({
                        nome: nome,
                        cor: cor,
                        icon: icon,
                        favorito: favorito,
                        owner: user._id,
                        followers: [user._id],
                    });

                    res.status(201).json({ data });
                } else {
                    res.status(401).json({ message: 'Board already exists' });
                }
            }
        } catch (error) {
            res.status(401).json(error);
        }
    }
    private async listMyBoard(req: Request, res: Response): Promise<void> {
        try {
            const user = await userModel.findOne({ _id: req.userId });
            if (!user) {
                res.status(404).json({ message: 'User not found' });
            } else {
                if (!req.params.id || req.params.id === 'all') {
                    const boards = await boardModel.find({
                        owner: user._id,
                    });
                    res.status(200).json({ boards });
                } else {
                    if (req.params.id === 'fav') {
                        const boards = await boardModel.find({
                            owner: user._id,
                            favorito: true,
                        });
                        res.status(200).json({ boards });
                    } else {
                        if (req.params.id === 'shared') {
                            const boards = await boardModel.find({
                                $or: [
                                    { owner: user._id },
                                    { followers: user._id },
                                ],
                            });
                            res.status(200).json({ boards });
                        } else {
                            res.status(400).json({
                                message:
                                    'Unknown param; It can only be: all, shared or fav',
                            });
                        }
                    }
                }
            }
        } catch (error) {
            res.status(401).json(error);
        }
    }
    private async deleteBoard(req: Request, res: Response): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await userModel.findOne({ _id: req.userId });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (!req.params.id) {
                return res.status(400).json({ message: 'Param not found' });
            }

            const cards = await cardModel.deleteMany({
                board: (req.params.e as any).algumacoisa,
            });
            const board = await boardModel.deleteOne({ _id: req.params.e });
            await session.commitTransaction();
            return res.status(200).json({ message: 'ok ok ' });
        } catch (error) {
            await session.abortTransaction();
            return res.status(401).json({ error: 'Something went wrong' });
        } finally {
            session.endSession();
        }
    }
    private async getThisBoard(req: Request, res: Response): Promise<void> {
        try {
            const user = await userModel.findOne({ _id: req.userId });
            if (!user) {
                res.status(404).json({ message: 'User not found' });
            } else {
                if (!req.params.id) {
                    res.status(400).json({ message: 'Param not found' });
                } else {
                    const cards = await cardModel.find({
                        board: req.params.id,
                        users: user._id,
                    });
                    res.status(200).json({ cards });
                }
            }
        } catch (error) {
            res.status(401).json(error);
        }
    }
}

export default BoardController;
