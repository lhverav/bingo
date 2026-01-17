import {SessionOptions} from 'iron-session';

export interface SessionData{
    userId:string;
    email:string;
    name:string;
    role:"host" | "admin";
    isLoggedIn:boolean;
}

export const sessionOptions:SessionOptions= {
    password: process.env.SESSION_SECRET!,
    cookieName:"bingp-session",
    cookieOptions:{
        secure: process.env.NODE_ENV === "production",
        httpOnly:true,
    },
};