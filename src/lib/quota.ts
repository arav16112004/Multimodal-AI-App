import { db } from "~/server/db";



export async function checkAndUpdateQuota(
    userId: string, 
    deductFromQuota: boolean = true
): Promise<boolean> {
    const quota = await db.apiQuota.findUniqueOrThrow({
        where: { userId },
    });

    const now = new Date();

    const lastReset = new Date(quota.lastResetDate);

    const daysSinceLastReset = Math.floor((now.getTime() - lastReset.getTime()));

    if(daysSinceLastReset >= 30){
        if(deductFromQuota){
            await db.apiQuota.update({
                where: {userId},
                data: {
                    lastResetDate: now,
                    requestsUsed: 1,
                }
            });
        }
        return true;
    }

    // check if quota is exceeded
    if(quota.requestsUsed >= quota.maxRequests){
        return false;
    }
    if(deductFromQuota){
        await db.apiQuota.update({
            where: {userId},
            data: {
                requestsUsed: quota.requestsUsed + 1,
            }
        });
    }
    return true;
}

    
