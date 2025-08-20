import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "~/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { checkAndUpdateQuota } from "~/lib/quota";
import { SageMakerClient } from "@aws-sdk/client-sagemaker";
import { InvokeEndpointCommand, SageMakerRuntimeClient } from "@aws-sdk/client-sagemaker-runtime";

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

        const {key} = await request.json();

        if(!key){
            return NextResponse.json({error: "Key is required"}, {status: 400});

        }

        const file = await db.videoFile.findUnique({
            where: {key},
            select:{
                userId: true,
                analyzed: true,
            }
            });

        if(!file){
            return NextResponse.json({error: "File not found"}, {status: 404});
        }

        if(file.userId !== quota.userId){
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        if(file.analyzed){
            return NextResponse.json({error: "File already analyzed"}, {status: 400});
        }

        const hasQuota = await checkAndUpdateQuota(quota.userId, true);

        if (!hasQuota) {
            return NextResponse.json({error: "Monthly Quota exceeded"}, {status: 429});
        }

        // call sagemaker endpoint
        const sagemakerClient = new SageMakerRuntimeClient({
            region: env.AWS_REGION,
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
        });

        const command = new InvokeEndpointCommand({
            EndpointName: env.AWS_ENDPOINT_NAME,
            ContentType: "application/json",
            Body: JSON.stringify({
                video_path: `s3://sentiment-analysis-saas-ai/${key}`
            }),
        });

        const response = await sagemakerClient.send(command);
        const analysis = JSON.parse(new TextDecoder().decode(response.Body));

        await db.videoFile.update({
            where: {key},
            data: {
                analyzed: true,
            }
        });





        return NextResponse.json({
            analysis,
            
        });

        
        
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Internal server error"}, {status: 500});
    }

}