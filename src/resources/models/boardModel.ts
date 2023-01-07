import Board from '@/utils/interfaces/boardInterface';
import { Schema, model } from 'mongoose';

const BoardSchema = new Schema({
    nome: { type: String, require: true },
    cor: { type: String, require: true },
    icon: { type: String, require: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', require: true },
    followers: { type: [String], require: true },
    tags: { type: [Object], require: true },
});

export default model<Board>('Board', BoardSchema);
