import Controller from '@/utils/interfaces/controllerInterface';
import { Router, Request, Response } from 'express';
import { boolean, string } from 'zod';
import z from 'zod';
import cardModel from '@/resources/models/cardModel';
import mongoose from 'mongoose';
import auth from '@/middleware/auth.middleware';
import userModel from '@/resources/models/userModel';
import boardModel from '@/resources/models/boardModel';
import raiaModel from '@/resources/models/raiaModel';
import bauth from '@/utils/bauth/bauth';

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
        this.router.get(`${this.path}/:filter`, auth, this.listMyBoard);
        /**
         * Listar cards de um determinado board
         */
        this.router.get(`${this.path}/from/:id`, auth, this.getThisBoard);
        /**
         *
         */
        this.router.delete(`${this.path}/:id`, auth, this.deleteBoard);
    }

    private async createNewBoard(req: Request, res: Response): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await userModel.findOne({ _id: req.userId });

            if (!user) {
                throw new Error('User not found');
            }

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
                await session.commitTransaction();
                return res.status(201).json({ data });
            } else {
                throw new Error('Board already exists');
            }
        } catch (error: any) {
            await session.abortTransaction();
            if (error.message === 'User not found') {
                return res.status(404).json({ message: 'User not found' });
            }
            if (error.message === 'Board already exists') {
                return res
                    .status(401)
                    .json({ message: 'Board already exists' });
            }

            return res.status(401).json({ error: 'Something went wrong' });
        } finally {
            session.endSession();
        }
    }
    private async listMyBoard(req: Request, res: Response): Promise<any> {
        try {
            const user = await userModel.findOne({ _id: req.userId });
            if (!user) {
                throw new Error('User not found');
            }
            if (
                !req.params.filter ||
                req.params.filter === 'all' ||
                req.params.filter === ''
            ) {
                const boards = await boardModel.find({
                    owner: user._id,
                });
                return res.status(200).json({ boards });
            }
            if (req.params.filter === 'fav') {
                const boards = await boardModel.find({
                    owner: user._id,
                    favorito: true,
                });
                return res.status(200).json({ boards });
            }
            if (req.params.filter === 'shared') {
                const boards = await boardModel.find({
                    $or: [{ owner: user._id }, { followers: user._id }],
                });
                return res.status(200).json({ boards });
            }
            return res.status(400).json({
                message: 'Unknown param; It can only be: all, shared or fav',
            });
        } catch (error: any) {
            if (error.message === 'User not found') {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.status(401).json({ error: 'Something went wrong' });
        }
    }
    private async deleteBoard(req: Request, res: Response): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await userModel.findOne({ _id: req.userId });

            if (!user) {
                throw new Error('User not found');
            }

            if (!req.params.id || req.params.id === '') {
                throw new Error('Param not found');
            }

            const raia = await raiaModel.findOne({ board: req.params.id });

            const cards = await cardModel.deleteMany({
                board: { $in: raia?.cards },
            });

            const board = await boardModel.deleteOne({ _id: req.params.id });

            await session.commitTransaction();

            return res.status(200).json({ message: 'Success on delete!' });
        } catch (error: any) {
            await session.abortTransaction();

            if (error.message === 'User not found') {
                return res.status(401).json({ message: 'User not found' });
            }
            if (error.message === 'Param not found') {
                return res.status(401).json({ message: 'Param not found' });
            }

            return res.status(401).json({ error: 'Something went wrong' });
        } finally {
            session.endSession();
        }
    }
    private async getThisBoard(req: Request, res: Response): Promise<any> {
        try {
            const user = await userModel.findOne({ _id: req.userId });
            if (!user) {
                throw new Error('User not found');
            }
            if (!req.params.id) {
                throw new Error('Param not found');
            }

            const board = await boardModel.findOne({
                _id: req.params.id,
            }); //                followers: user._id,

            if (!board) {
                throw new Error('Board not found');
            }
            if (!board.followers.includes(user._id)) {
                return res.status(555).json({
                    board,
                    message:
                        'You are not allowed to go further, contact the owner of the board',
                });
            }

            const raia = await raiaModel
                .find({
                    board: req.params.id,
                })
                .populate('cards');

            const users = await bauth.post('/user/list', {
                listArray: board.followers,
            });
            const listOfUser = users.data;
            return res
                .status(200)
                .json({ board, raia, users: listOfUser.user });
        } catch (error: any) {
            console.log(error);
            if (error.message === 'User not found') {
                return res.status(404).json({ message: 'User not found' });
            }
            if (error.message === 'Param not found') {
                return res.status(404).json({ message: 'Param not found' });
            }
            if (error.message === 'Board not found') {
                return res.status(404).json({ message: 'Board not found' });
            }
            return res.status(401).json({ error: 'Something went wrong' });
        }
    }
}

export default BoardController;
