import auth from '@/middleware/auth.middleware';
import boardModel from '@/resources/models/boardModel';
import favoritesModel from '@/resources/models/favoritesModel';
import userModel from '@/resources/models/userModel';
import Controller from '@/utils/interfaces/controllerInterface';
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';

class favoritesController implements Controller {
    path = '/favorites';
    router: Router;

    constructor() {
        this.router = Router();
    }

    public async initialiseRoutes(): Promise<void> {
        this.router.post(`${this.path}`, auth, this.createNewFav);
    }

    private async createNewFav(req: Request, res: Response): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            /*const user = await userModel.findById(req.userId);
            if (!user) {
                throw new Error('User not found');
            }*/
            const favBody = z.object({
                boardId: z.string(),
            });

            const { boardId } = favBody.parse(req.body);

            const board = await boardModel.findById(boardId);
            if (!board) {
                throw new Error('Board not found');
            }
            if (!board.followers.includes(req.userId)) {
                throw new Error(
                    'User is not allowed to fav this board, must be a follower first'
                );
            }

            const favs = await favoritesModel.findOne({
                userId: req.userId,
            });

            let message = '';

            if (!favs) {
                await favoritesModel.create({
                    userId: req.userId,
                    favorites: [board._id],
                });
                message = 'First fav from this user recorded';
            } else {
                if (favs.favorites.includes(board._id)) {
                    message = 'Fav removed';
                    favs.favorites.splice(favs.favorites.indexOf(board._id), 1);
                    favs.save();
                } else {
                    favs.favorites.push(board._id);
                    favs.save();
                    message = 'New fav from this user recorded';
                }
            }

            await session.commitTransaction();
            return res.status(201).json({
                message: message,
            });
        } catch (error: any) {
            await session.abortTransaction();
            if (error.message === 'User not found') {
                return res.status(401).json({ message: 'User not found' });
            }
            if (error.message === 'Board not found') {
                return res.status(401).json({ message: 'Board not found' });
            }
            if (
                error.message ===
                'User is not allowed to fav this board, must be a follower first'
            ) {
                return res.status(401).json({
                    message:
                        'User is not allowed to fav this board, must be a follower first',
                });
            }
            return res.status(401).json({ error: 'Something went wrong' });
        } finally {
            await session.endSession();
        }
    }
}

export default favoritesController;
