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
        this.router.put(`${this.path}/:cardId`, auth, this.updateCard);
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
                priority: z.number().optional(),
            });

            const { title, subtitle, dateEnd, tags, raiaID, users, priority } =
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
                priority: priority,
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
    private async updateCard(req: Request, res: Response): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const cardBody = z.object({
                title: z.string().optional(),
                subtitle: z.string().optional(),
                dateEnd: z.string().optional(),
                tags: z.array(z.string()).optional(),
                priority: z.number().optional(),
                users: z.array(z.string()).optional(),
                fromRaiaId: z.string().optional(),
                toRaiaId: z.string().optional(),
                boardId: z.string().optional(),
            });

            const {
                title,
                subtitle,
                dateEnd,
                tags,
                priority,
                users,
                fromRaiaId,
                toRaiaId,
                boardId,
            } = cardBody.parse(req.body);

            if (!req.params.cardId) {
                throw new Error('Param not found');
            }

            const user = await userModel.findOne({ _id: req.userId });

            if (!user) {
                throw new Error('User not found');
            }

            if (users) {
                const board = await boardModel.findOne({
                    _id: boardId,
                    followers: { $in: users },
                    tags: {
                        $elemMatch: { id: { $all: tags } },
                    },
                });

                if (!board) {
                    throw new Error('User is not member of board');
                }
            }

            const card = await cardModel.findById(req.params.cardId);
            if (!card) {
                throw new Error('Card cannot be updated');
            }

            if (fromRaiaId && toRaiaId) {
                const raiaEnvia = await raiaModel.findById(fromRaiaId);
                const raiaRecebe = await raiaModel.findById(toRaiaId);

                if (!raiaEnvia || !raiaRecebe) {
                    throw new Error(
                        'Unable to continue due one or both raias not found'
                    );
                }

                if (
                    !raiaEnvia.users.includes(user._id) ||
                    !raiaRecebe.users.includes(user._id) ||
                    !raiaEnvia.cards.includes(req.params.cardId)
                ) {
                    throw new Error(
                        'Unable to continue due user not allowed or card not found'
                    );
                }
            }

            const updated = await cardModel.updateOne(
                { _id: req.params.cardId },
                {
                    title: title || card.title,
                    subtitle: subtitle || card.subtitle,
                    dateEnd: dateEnd || card.dateEnd,
                    tags: tags || card.tags,
                    priority: priority || card.priority,
                    users: users || card.users,
                }
            );

            session.commitTransaction();
            res.status(201).send({
                message: 'Updated with success',
                card: updated,
            });
        } catch (error: any) {
            console.log(error);
            await session.abortTransaction();
            if (error.message === 'User not found') {
                return res.status(401).json({ message: 'User not found' });
            }
            if (error.message === 'Param not found') {
                return res.status(401).json({ message: 'Param not found' });
            }
            if (error.message === 'Card cannot be updated') {
                return res
                    .status(401)
                    .json({ message: 'Card cannot be updated' });
            }
            return res.status(401).json({ error: 'Something went wrong' });
        } finally {
            await session.endSession();
        }
    }
}

export default CardController;
