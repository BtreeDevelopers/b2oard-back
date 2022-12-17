import Favorites from '@/utils/interfaces/favoritesInterface';
import { Schema, model } from 'mongoose';

const FavoritesSchema = new Schema({
    userId: { type: String, require: true },
    favorites: { type: [String], require: true },
});

export default model<Favorites>('Favorites', FavoritesSchema);
