import { Document } from 'mongoose';

interface Card extends Document {
    title: string;
    subtitle: string;
    dateEnd: string;
    tags: Array<string>;
    users: Array<string>;
    priority: Number;
}

export default Card;
