import Raia from '@/utils/interfaces/raiaInterface';
import { model, Schema } from 'mongoose';

const RaiaSchema = new Schema({
    title: { type: String, require: true },
    board: { type: String, require: true },
    users: { type: [String], require: true },
    cards: { type: [Schema.Types.ObjectId], ref: 'Card', require: true },
});

export default model<Raia>('Raia', RaiaSchema);
