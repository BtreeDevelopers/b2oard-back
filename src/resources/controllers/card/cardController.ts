import auth from '@/middleware/auth.middleware';
import boardModel from '@/resources/models/boardModel';
import cardModel from '@/resources/models/cardModel';
import userModel from '@/resources/models/userModel';
import Controller from '@/utils/interfaces/controllerInterface';
import { Request, Response, Router } from 'express';
import z, { string } from 'zod';

class CardController implements Controller {
    public path = '/card';
    public router: Router;

    constructor() {
        this.router = Router();
    }

    public async initialiseRoutes(): Promise<void> {
        this.router.post(`${this.path}/:boardId`, auth, this.createNewCard);
    }

    private async createNewCard(req: Request, res: Response): Promise<void> {
        try {
            const user = await userModel.find({ id: req.userId });
            if (!user) {
                res.status(404).json({ message: 'User not found' });
            } else {
                if (!req.params.boardId) {
                    res.status(400).json({ message: 'Param not found' });
                } else {
                    const board = await boardModel.find({
                        _id: req.params.boardId,
                    });
                    if (!board) {
                        res.status(400).json({ message: 'Board not found' });
                    } else {
                        const cardBody = z.object({
                            title: string(),
                            subtitle: string(),
                            dateEnd: string(),
                            tags: z.array(z.string()),
                        });

                        const { title, subtitle, dateEnd, tags } =
                            cardBody.parse(req.body);

                        const data = await cardModel.create({
                            title: title,
                            subtitle: subtitle,
                            dateEnd: dateEnd,
                            tags: tags,
                            users: [req.userId],
                            board: req.params.boardId,
                        });
                        res.status(200).json({ data });
                    }
                }
            }
        } catch (error) {
            res.status(401).send(error);
        }
    }
}

export default CardController;
