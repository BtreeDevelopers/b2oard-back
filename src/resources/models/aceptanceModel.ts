import Aceptance from '@/utils/interfaces/aceptanceInterface';
import { model, Schema } from 'mongoose';

const AceptanceSchema = new Schema({
    boardId: { type: String, require: true },
    guestId: { type: String, require: true },
    ownerId: { type: String, require: true },
});
export default model<Aceptance>('Aceptance', AceptanceSchema);
