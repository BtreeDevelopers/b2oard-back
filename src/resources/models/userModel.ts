import User from "@/utils/interfaces/userInterfaces";
import { Schema, model } from "mongoose";

const UserSchema = new Schema(
    {
        nome: {type:String, require:true},
        email: {type:String, require:true},
    },

)

export default model<User>('User',UserSchema);