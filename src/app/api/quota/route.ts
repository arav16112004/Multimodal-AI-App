import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const apiQuota = await db.apiQuota.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        secretKey: true,
        requestsUsed: true,
        maxRequests: true,
      },
    });

    if (!apiQuota) {
      // Create a new API quota if one doesn't exist
      const newApiQuota = await db.apiQuota.create({
        data: {
          userId: session.user.id,
          secretKey: `sa_live_${crypto.randomBytes(24).toString("hex")}`,
          requestsUsed: 0,
          maxRequests: 10000,
        },
        select: {
          secretKey: true,
          requestsUsed: true,
          maxRequests: true,
        },
      });
      return NextResponse.json(newApiQuota);
    }

    return NextResponse.json(apiQuota);
  } catch (error) {
    console.error("Error fetching API quota:", error);
    return NextResponse.json({ error: "Failed to fetch API quota" }, { status: 500 });
  }
}
