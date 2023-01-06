import auth from '@/middleware/auth.middleware';
import boardModel from '@/resources/models/boardModel';
import cardModel from '@/resources/models/cardModel';
import raiaModel from '@/resources/models/raiaModel';
import userModel from '@/resources/models/userModel';
import Controller from '@/utils/interfaces/controllerInterface';
import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import z, { string } from 'zod';

class CardController implements Controller {
    public path = '/card';
    public router: Router;

    constructor() {
        this.router = Router();
    }

    public async initialiseRoutes(): Promise<void> {
        this.router.post(`${this.path}`, auth, this.createNewCard);
        this.router.delete(`${this.path}/:cardId`, auth, this.deleteCard);
    }

    private async createNewCard(req: Request, res: Response): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await userModel.find({ id: req.userId });
            if (!user) {
                throw new Error('User not found');
            }
            const cardBody = z.object({
                title: z.string(),
                subtitle: z.string().optional(),
                dateEnd: z.string().optional(),
                tags: z.array(z.string()).optional(),
                users: z.array(z.string()).optional(),
                raiaID: z.string(),
            });

            const { title, subtitle, dateEnd, tags, raiaID, users } =
                cardBody.parse(req.body);

            const raia = await raiaModel.findOne({
                _id: raiaID,
            });
            if (!raia) {
                throw new Error('Raia not found');
            }

            const board = await boardModel.findOne({
                _id: raia.board,
                users: users,
            });
            if (!board) {
                throw new Error('User cannot be add');
            }
            /*const idUsers: string[] = [];

            idUsers.push(req.userId);
            users?.forEach((element) => {
                idUsers.push(element);
            });*/
            const data = await cardModel.create({
                title: title,
                subtitle: subtitle,
                dateEnd: dateEnd,
                tags: tags,
                users: users,
            });

            raia.cards.push(data._id);
            raia.save();

            await session.commitTransaction();

            return res.status(200).json({ data });
        } catch (error: any) {
            await session.abortTransaction();
            if (error.message === 'User not found') {
                return res.status(401).json({ message: 'User not found' });
            }
            if (error.message === 'Param not found') {
                res.status(400).json({ message: 'Param not found' });
            }
            if (error.message === 'Raia not found') {
                res.status(400).json({ message: 'Raia not found' });
            }
            if (error.message === 'User cannot be add') {
                res.status(400).json({ message: 'User cannot be add' });
            }
            res.status(401).send(error);
        } finally {
            await session.endSession();
        }
    }
    private async deleteCard(req: Request, res: Response): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await userModel.findOne({ _id: req.userId });

            if (!user) {
                throw new Error('User not found');
            }

            if (!req.params.cardId) {
                throw new Error('Param not found');
            }

            await cardModel.deleteOne({ _id: req.params.cardId });

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
            await session.endSession();
        }
    }
}

export default CardController;
