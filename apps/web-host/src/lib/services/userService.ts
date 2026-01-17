import { connectToDatabase } from "../mongodb"
import User, {IUserDocument} from "@/lib/models/user"
import bcrypt from "bcryptjs"



export async function findUserByCredentials(
    email:string,
    password:string
):Promise<IUserDocument | null> {
    await connectToDatabase();

    const user= await User.findOne({email:email.toLowerCase()});

    if(!user){
        return null;
    }

    const isPasswordValid= await bcrypt.compare(password, user.password);

    if(!isPasswordValid){
        return null;
    }
    return user;
}

export async function getUserById(id:string):Promise<IUserDocument | null>{
    await connectToDatabase();
    return User.findById(id);
}

export async function createUser(
    email:string,
    password:string,
    name:string,
    role:"host" | "admin" = "host"
):Promise<IUserDocument>{
    await connectToDatabase();
    const hashedPassword= await bcrypt.hash(password, 10);

    const user= await User.create({
        email:email.toLowerCase(),
        password:hashedPassword,
        name,
        role,
    });

    return user;
}