import { Document } from 'mongoose';

interface Raia extends Document {
    title: string;
    board: string;
    users: Array<string>;
    cards: Array<string>;
}

export default Raia;
