import { Document } from 'mongoose';

interface Board extends Document {
    nome: string;
    cor: string;
    icon: string;
    favorito: boolean;
    owner: string;
    followers: Array<string>;
}

export default Board;
