import { Document } from 'mongoose';

interface Board extends Document {
    nome: string;
    cor: string;
    icon: string;
    owner: string;
    followers: Array<string>;
    tags: Array<{ id: string; text: string; color: string }>;
}

export default Board;
