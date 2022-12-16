import { Document } from 'mongoose';

interface Aceptance extends Document {
    boardId: string;
    guestId: string;
    ownerId: string;
}

export default Aceptance;
