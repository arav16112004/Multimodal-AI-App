"use server";

import { db } from "~/server/db";
import { signupSchema, type SignupSchema } from "~/schemas/auth";
import { hash } from "bcryptjs";





export async function registerUser(data: SignupSchema) {
    try{
        // server side val
        const result = signupSchema.safeParse(data);

        if(!result.success){
            return {error: "Invalid data"}
        }

        const {name, email, password} = data;

        const existingUser = await db.user.findUnique({where: {email: email}});

        if(existingUser){
            return {error: "User already exists"}
        }

        const hashedPassword = await hash(password, 12);

        const user = await db.user.create({data: {name, email, password: hashedPassword}});

        return {sucess:true}

    }catch(error){
        return {error: "Something went wrong"}
    }
}