import auth from '@/middleware/auth.middleware';
import userModel from '@/resources/models/userModel';
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
    }

    private async createNewRaia(req: Request, res: Response): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await userModel.findOne({ _id: req.userId });
            if (!user) {
                throw new Error('User not found');
            }

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
                users: [user._id],
            });
            await session.commitTransaction();
            return res.status(201).json({ data });
        } catch (error: any) {
            session.abortTransaction();
            if (error.message === 'User not found') {
                return res.status(404).json({ message: 'User not found' });
            }
            if (error.message === 'Board not found') {
                return res.status(401).json({ message: 'Board not found' });
            }
            return res.status(401).json({ error: 'Something went wrong' });
        } finally {
            session.endSession();
        }
    }
    //REMOVER
    private async readRaia(req: Request, res: Response): Promise<any> {
        try {
            const user = await userModel.findOne({ _id: req.userId });
            if (!user) {
                throw new Error('User not found');
            }
            const raias = await raiaModel.find({ users: { $in: user._id } });
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

            session.commitTransaction();
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
            session.endSession();
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

            raiaModel.deleteOne({ _id: req.params.id });

            session.commitTransaction();
            return res.status(201).json({
                message: 'Success on delete!',
            });
        } catch (error: any) {
            session.abortTransaction();

            if (error.message === 'Param not found') {
                return res.status(401).json({ message: 'Param not found' });
            }
            if (error.message === 'ID not found') {
                return res.status(401).json({ message: 'ID not found' });
            }

            return res.status(401).json({ error: 'Something went wrong' });
        } finally {
            session.endSession();
        }
    }
}
export default RaiaController;
