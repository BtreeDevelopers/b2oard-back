import Card from '@/utils/interfaces/cardInterface';
import { Schema, model } from 'mongoose';

const CardSchema = new Schema({
    title: { type: String, require: true },
    subtitle: { type: String, require: true },
    dateEnd: { type: String, require: true },
    tags: { type: [String], require: true },
    users: { type: [String], require: true },
});

export default model<Card>('Card', CardSchema);
