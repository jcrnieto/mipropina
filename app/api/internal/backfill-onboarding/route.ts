import { NextResponse } from "next/server";
import { requireSignedInUser } from "@/app/lib/auth";
import { getBrandByClerkId } from "@/app/lib/server/modules/brands/brands.service";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST() {
  const user = await requireSignedInUser();

  const brand = await getBrandByClerkId(user.id);
  if (!brand) {
    return NextResponse.json({ ok: false, error: "no-brand" }, { status: 400 });
  }

  const adminPath = `/admin/${brand.slug}`;
  const storePath = `/${brand.public_path ?? brand.slug}`;

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        brandId: brand.id,
        brandSlug: brand.slug,
        adminPath,
        storePath,
      },
    });

    return NextResponse.json({ ok: true, adminPath, storePath });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
