import auth from '@/middleware/auth.middleware';
import aceptanceModel from '@/resources/models/aceptanceModel';
import boardModel from '@/resources/models/boardModel';
//import userModel from '@/resources/models/userModel';
import { bauth } from '@/utils/bauth/bauth';
import Controller from '@/utils/interfaces/controllerInterface';
import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import z from 'zod';

class AceptanceController implements Controller {
    public path = '/aceptance';
    public router: Router;
    constructor() {
        this.router = Router();
    }

    public async initialiseRoutes(): Promise<void> {
        this.router.get(
            `${this.path}/:boardID`,
            auth,
            this.createNewAceptanceCall
        );
        this.router.get(`${this.path}`, auth, this.getAllAceptanceCall);
        this.router.post(`${this.path}`, auth, this.responseAceptanceCall);
    }

    private async createNewAceptanceCall(
        req: Request,
        res: Response
    ): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            /*const user = await userModel.findOne({ _id: req.userId });
            if (!user) {
                throw new Error('User not found');
            }*/
            if (!req.params.boardID || req.params.boardID === '') {
                throw new Error('Param not found');
            }

            const board = await boardModel.findById(req.params.boardID);

            if (!board) {
                throw new Error('Board not found');
            }

            if (board.followers.includes(req.userId)) {
                return res
                    .status(400)
                    .json({ message: 'User already following this board' });
            }

            const aceptance = await aceptanceModel.findOne({
                boardId: board._id,
                guestId: req.userId,
                ownerId: board.owner,
            });

            if (!aceptance) {
                const data = await aceptanceModel.create({
                    boardId: board._id,
                    guestId: req.userId,
                    ownerId: board.owner,
                });

                await session.commitTransaction();
                return res
                    .status(201)
                    .json({ message: 'You request was sended to the owner' });
            }
            throw new Error('Aceptance request already sended');
        } catch (error: any) {
            await session.abortTransaction();
            if (error.message === 'User not found') {
                return res.status(401).json({ message: 'User not found' });
            }
            if (error.message === 'Param not found') {
                return res.status(401).json({ message: 'Param not found' });
            }
            if (error.message === 'Board not found') {
                return res.status(401).json({ message: 'Board not found' });
            }
            if (error.message === 'Aceptance request already sended') {
                return res
                    .status(401)
                    .json({ message: 'Aceptance request already sended' });
            }
            return res.status(401).json({ error: 'Something went wrong' });
        } finally {
            await session.endSession();
        }
    }

    private async getAllAceptanceCall(
        req: Request,
        res: Response
    ): Promise<any> {
        try {
            /* const user = await userModel.findOne({ _id: req.userId });
            if (!user) {
                throw new Error('User not found');
            }
            */
            const listOfAceptances = await aceptanceModel.find({
                ownerId: req.userId,
            });

            const idBoardsToAcept: string[] = [];
            const listOfUsersWhoWantsToJoin: string[] = [];
            listOfAceptances.forEach((element) => {
                idBoardsToAcept.push(element.boardId);
                listOfUsersWhoWantsToJoin.push(element.guestId);
            });

            const boardWithCallsToAcept = await boardModel.find({
                _id: { $in: idBoardsToAcept },
            });

            const nameOfTheBoardsToAcept: string[] = [];
            boardWithCallsToAcept.forEach((element) => {
                nameOfTheBoardsToAcept.push(...element.nome);
            });

            const users = await bauth.post('/user/list', {
                listArray: listOfUsersWhoWantsToJoin,
            });

            return res.status(200).json({
                listOfAceptances,
                boardWithCallsToAcept,
                users: users.data.user,
            });
        } catch (error: any) {
            console.log(error.response);
            return res.status(401).json({ error: 'Something went wrong' });
        }
    }

    private async responseAceptanceCall(
        req: Request,
        res: Response
    ): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            /*const user = await userModel.findOne({ _id: req.userId });
            if (!user) {
                throw new Error('User not found');
            }*/

            const aceptanceBody = z.object({
                boardId: z.string(),
                guestId: z.string(),
                answer: z.boolean(),
            });

            const { boardId, guestId, answer } = aceptanceBody.parse(req.body);

            /*const guest = await userModel.findById(guestId);
            if (!guest) {
                throw new Error('User not found');
            }*/
            const board = await boardModel.findById(boardId);
            if (!board) {
                throw new Error('Board not found');
            }

            await aceptanceModel.deleteOne({
                boardId: boardId,
                guestId: guestId,
            });

            let message = 'Guest denied access as follower';

            if (answer) {
                board.followers.push(guestId);
                board.save();
                message = 'Guest acept as follower';
            }

            await session.commitTransaction();

            return res.status(200).json({ message });
        } catch (error) {
            await session.abortTransaction();
            return res.status(401).json({ error: 'Something went wrong' });
        } finally {
            await session.endSession();
        }
    }
}

export default AceptanceController;
