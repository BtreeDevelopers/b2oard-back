import auth from '@/middleware/auth.middleware';
//import userModel from '@/resources/models/userModel';
import Controller from '@/utils/interfaces/controllerInterface';
import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import z, { string } from 'zod';
import raiaModel from '@/resources/models/raiaModel';
import boardModel from '@/resources/models/boardModel';
import cardModel from '@/resources/models/cardModel';

class RaiaController implements Controller {
    public path = '/raia';
    public router: Router;

    constructor() {
        this.router = Router();
    }

    public async initialiseRoutes(): Promise<void> {
        this.router.post(`${this.path}`, auth, this.createNewRaia);
        this.router.get(`${this.path}`, auth, this.readRaia);
        this.router.put(`${this.path}/:id`, auth, this.updateRaia);
        this.router.delete(`${this.path}/:id`, auth, this.deleteRaia);
        this.router.put(`${this.path}`, auth, this.exchangeCards);
    }

    private async createNewRaia(req: Request, res: Response): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            /*const user = await userModel.findOne({ _id: req.userId });
            if (!user) {
                throw new Error('User not found');
            }*/

            const newRaiaBody = z.object({
                title: string(),
                board: string(),
            });

            const { title, board } = newRaiaBody.parse(req.body);

            const boardExists = boardModel.findOne({ _id: board });
            if (!boardExists) {
                throw new Error('Board not found');
            }
            const data = await raiaModel.create({
                title: title,
                board: board,
                users: [req.userId],
            });
            await session.commitTransaction();
            return res.status(201).json({ data });
        } catch (error: any) {
            await session.abortTransaction();
            if (error.message === 'User not found') {
                return res.status(404).json({ message: 'User not found' });
            }
            if (error.message === 'Board not found') {
                return res.status(401).json({ message: 'Board not found' });
            }
            return res.status(401).json({ error: 'Something went wrong' });
        } finally {
            await session.endSession();
        }
    }
    //REMOVER
    private async readRaia(req: Request, res: Response): Promise<any> {
        try {
            /*const user = await userModel.findOne({ _id: req.userId });
            if (!user) {
                throw new Error('User not found');
            }*/
            const raias = await raiaModel.find({ users: { $in: req.userId } });
            return res.status(201).json({ raias });
        } catch (error: any) {
            if (error.message === 'User not found') {
                return res.status(401).json({ error: 'User not found' });
            }
            return res.status(401).json({ error: 'Something went wrong' });
        }
    }

    private async updateRaia(req: Request, res: Response): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            if (!req.params.id || req.params.id === '') {
                throw new Error('Param not found');
            }
            const updateRaia = z.object({
                title: string(),
            });

            const { title } = updateRaia.parse(req.body);

            const raiaExists = raiaModel.findOne({ _id: req.params.id });
            if (!raiaExists) {
                throw new Error('Raia not found');
            }

            const data = await raiaModel.updateOne(
                {
                    _id: req.params.id,
                },
                { title: title }
            );

            await session.commitTransaction();
            return res
                .status(201)
                .json({ message: 'Update done with success' });
        } catch (error: any) {
            await session.abortTransaction();
            console.log(error);
            if (error.message === 'Param not found') {
                return res.status(401).json({ message: 'Param not found' });
            }
            if (error.message === 'Raia not found') {
                return res.status(400).json({ message: 'Raia not found' });
            }
            return res.status(401).json({ error: 'Something went wrong' });
        } finally {
            await session.endSession();
        }
    }

    private async deleteRaia(req: Request, res: Response): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            if (!req.params.id || req.params.id === '') {
                throw new Error('Param not found');
            }

            const raia = await raiaModel.findOne({ _id: req.params.id });

            if (!raia) {
                return new Error('ID not found');
            }

            await cardModel.deleteMany({ _id: { $in: raia.cards } });

            await raiaModel.deleteOne({ _id: req.params.id });

            await session.commitTransaction();
            return res.status(201).json({
                message: 'Success on delete!',
            });
        } catch (error: any) {
            await session.abortTransaction();

            if (error.message === 'Param not found') {
                return res.status(401).json({ message: 'Param not found' });
            }
            if (error.message === 'ID not found') {
                return res.status(401).json({ message: 'ID not found' });
            }

            return res.status(401).json({ error: 'Something went wrong' });
        } finally {
            await session.endSession();
        }
    }

    private async exchangeCards(req: Request, res: Response): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            /*const user = await userModel.findOne({ _id: req.userId });
            if (!user) {
                throw new Error('User not found');
            }*/
            const requestBody = z.object({
                fromRaiaId: string(),
                toRaiaId: string(),
                cardId: string(),
            });

            const { fromRaiaId, toRaiaId, cardId } = requestBody.parse(
                req.body
            );

            const raiaEnvia = await raiaModel.findById(fromRaiaId);
            const raiaRecebe = await raiaModel.findById(toRaiaId);

            if (!raiaEnvia || !raiaRecebe) {
                throw new Error(
                    'Unable to continue due one or both raias not found'
                );
            }

            if (
                !raiaEnvia.users.includes(req.userId) ||
                !raiaRecebe.users.includes(req.userId) ||
                !raiaEnvia.cards.includes(cardId)
            ) {
                throw new Error(
                    'Unable to continue due user not allowed or card not found'
                );
            }
            raiaRecebe.cards.push(cardId);
            raiaRecebe.save();
            raiaEnvia.cards.splice(raiaEnvia.cards.indexOf(cardId), 1);
            raiaEnvia.save();

            await session.commitTransaction();
            return res
                .status(201)
                .json({ message: 'Tranference complete with success' });
        } catch (error: any) {
            await session.abortTransaction();
            if (error.message === 'User not found') {
                return res.status(401).json({ message: 'User not found' });
            }
            if (
                error.message ===
                'Unable to continue due one or both raias not found'
            ) {
                return res.status(401).json({
                    message:
                        'Unable to continue due one or both raias not found',
                });
            }
            if (
                error.message ===
                'Unable to continue due user not allowed or card not found'
            ) {
                return res.status(401).json({
                    message:
                        'Unable to continue due user not allowed or card not found',
                });
            }

            return res.status(401).json({ error: 'Something went wrong' });
        } finally {
            await session.endSession();
        }
    }
}
export default RaiaController;
