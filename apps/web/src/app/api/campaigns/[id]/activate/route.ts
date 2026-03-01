export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, campaigns } from "@referkit/db";
import { eq, and } from "@referkit/db";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, params.id), eq(campaigns.userId, session.user.id)))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(campaigns)
      .set({ status: "active" })
      .where(eq(campaigns.id, params.id))
      .returning();

    return NextResponse.json({ campaign: updated });
  } catch (err) {
    console.error("[campaigns/[id]/activate]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
