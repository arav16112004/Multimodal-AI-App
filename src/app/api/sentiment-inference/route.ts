import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "~/env";
import { checkAndUpdateQuota } from "~/lib/quota";
import { SageMakerRuntimeClient, InvokeEndpointAsyncCommand } from "@aws-sdk/client-sagemaker-runtime";
import { randomUUID } from "crypto";

// GET method to check status and retrieve results
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');
        const requestId = searchParams.get('requestId');

        if (!key || !requestId) {
            return NextResponse.json({ error: "Key and requestId are required" }, { status: 400 });
        }

        const apiKey = request.headers.get("Authorization")?.replace("Bearer ", "");

        if (!apiKey) {
            return NextResponse.json({ error: "API key is required" }, { status: 401 });
        }

        const quota = await db.apiQuota.findUnique({
            where: { secretKey: apiKey },
            select: { userId: true }
        });

        if (!quota) {
            return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
        }

        const file = await db.videoFile.findUnique({
            where: { key },
            select: { userId: true, analyzed: true }
        });

        if (!file || file.userId !== quota.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if results are ready
        const s3Client = new S3Client({
            region: env.AWS_REGION,
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputKey = `async-out/${timestamp}-${requestId}-results.json`;

        try {
            const result = await s3Client.send(new GetObjectCommand({
                Bucket: env.AWS_INFERENCE_BUCKET,
                Key: outputKey,
            }));

            const resultBody = await result.Body?.transformToString();
            const analysis = JSON.parse(resultBody || '{}');

            // Update video file as analyzed
            await db.videoFile.update({
                where: { key },
                data: { analyzed: true }
            });

            return NextResponse.json({
                status: "completed",
                analysis,
                outputLocation: `s3://${env.AWS_INFERENCE_BUCKET}/${outputKey}`
            });

        } catch (s3Error: any) {
            if (s3Error.name === 'NoSuchKey') {
                // Results not ready yet
                return NextResponse.json({
                    status: "processing",
                    message: "Analysis still in progress. Check back later."
                }, { status: 200 });
            }
            throw s3Error;
        }

    } catch (error) {
        console.error('Status check error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST method for starting async inference
export async function POST(request: Request) {
    try {
        const apiKey = request.headers.get("Authorization")?.replace("Bearer ", "");

        if (!apiKey) {
            return NextResponse.json({ error: "API key is required" }, { status: 401 });
        }

        const quota = await db.apiQuota.findUnique({
            where: {
                secretKey: apiKey
            },
            select: {
                userId: true,
            }
        });

        if (!quota) {
            return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
        }

        const { key } = await request.json();

        if (!key) {
            return NextResponse.json({ error: "Key is required" }, { status: 400 });
        }

        const file = await db.videoFile.findUnique({
            where: { key },
            select: {
                userId: true,
                analyzed: true,
            }
        });

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        if (file.userId !== quota.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (file.analyzed) {
            return NextResponse.json({ error: "File already analyzed" }, { status: 400 });
        }

        const hasQuota = await checkAndUpdateQuota(quota.userId, true);

        if (!hasQuota) {
            return NextResponse.json({ error: "Monthly Quota exceeded" }, { status: 429 });
        }

        // Initialize S3 client
        const s3Client = new S3Client({
            region: env.AWS_REGION,
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
        });

        // Initialize SageMaker client
        const sagemakerClient = new SageMakerRuntimeClient({
            region: env.AWS_REGION,
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
        });

        // Generate unique request ID
        const requestId = randomUUID();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // S3 paths for async inference
        const inputKey = `requests/${timestamp}-${requestId}-payload.json`;
        const outputKey = `async-out/${timestamp}-${requestId}-results.json`;

        // Prepare the input payload
        const inputPayload = {
            video_path: `s3://sentiment-analysis-saas-ai/${key}`
        };

        // Upload input payload to S3
        await s3Client.send(new PutObjectCommand({
            Bucket: env.AWS_INFERENCE_BUCKET,
            Key: inputKey,
            Body: JSON.stringify(inputPayload),
            ContentType: "application/json",
        }));

        console.log('Input payload uploaded to S3:', inputKey);

        // Call SageMaker async endpoint
        const command = new InvokeEndpointAsyncCommand({
            EndpointName: "sentiment-endpoint-async", // Use async endpoint
            InputLocation: `s3://${env.AWS_INFERENCE_BUCKET}/${inputKey}`,
            InvocationTimeoutSeconds: 1800, // 30 minutes
        });

        console.log('Calling SageMaker async endpoint: sentiment-endpoint-async');
        console.log('Input location:', `s3://${env.AWS_INFERENCE_BUCKET}/${inputKey}`);
        console.log('Command details:', JSON.stringify(command, null, 2));

        try {
            const response = await sagemakerClient.send(command);
            console.log('Async inference started successfully');
            console.log('Response details:', JSON.stringify(response, null, 2));
        } catch (sagemakerError) {
            console.error('SageMaker async error:', sagemakerError);
            throw sagemakerError;
        }

        // Update video file status to processing
        await db.videoFile.update({
            where: { key },
            data: {
                analyzed: false, // Keep as false until results are ready
            }
        });

        // Return 202 Accepted with output location
        return NextResponse.json({
            status: "processing",
            requestId: requestId,
            outputLocation: `s3://${env.AWS_INFERENCE_BUCKET}/${outputKey}`,
            message: "Video analysis started. Results will be available at the output location."
        }, { status: 202 });

    } catch (error) {
        console.error('Async inference error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}