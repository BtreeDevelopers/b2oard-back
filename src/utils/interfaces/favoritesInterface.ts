import { Document } from 'mongoose';

interface Favorites extends Document {
    userId: string;
    favorites: Array<string>;
}

export default Favorites;
