import Board from '@/utils/interfaces/boardInterface';
import { Schema, model } from 'mongoose';

const BoardSchema = new Schema({
    nome: { type: String, require: true },
    cor: { type: String, require: true },
    icon: { type: String, require: true },
    favorito: { type: Boolean, require: true },
    owner: { type: String, require: true },
    followers: { type: [String], require: true },
});

export default model<Board>('Board', BoardSchema);