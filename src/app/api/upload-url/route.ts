import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "~/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


export async function POST(request: Request) {
    try{

        const apiKey = request.headers.get("Authorization")?.replace("Bearer ", "");

        if(!apiKey){
            return NextResponse.json({error: "API key is required"}, {status: 401});
        }


        const quota = await db.apiQuota.findUnique({
            where: {
                secretKey: apiKey
            },
            select:{
                userId: true,
            }
        });

        if(!quota){
            return NextResponse.json({error: "Invalid API key"}, {status: 401});
        }

        const {fileType} = await request.json();
        if (!fileType || !fileType.match(/\.(mp4|mov|avi)$/i)) {
            return NextResponse.json({error: "Invalid file type"}, {status: 400});
        }

        const s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
        });

        const id = crypto.randomUUID();

        const key = `inference/${id}${fileType}`;

        // TODO: Generate presigned URL logic here
        
        const command = new PutObjectCommand({
            Bucket: env.AWS_INFERENCE_BUCKET,
            Key: key,
            ContentType: `video/${fileType.replace(".", "")}`,
        })
        const url = await getSignedUrl(s3Client, command, {expiresIn: 3600})

        await db.videoFile.create({
            data: {
                key:key,
                userId: quota.userId,
                analyzed: false,

            }
        });


        return NextResponse.json({
            url,
            fileId: id,
            fileType,
            key,
        });





    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Internal server error"}, {status: 500});
    }

}