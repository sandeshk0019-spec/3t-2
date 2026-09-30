import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const farmerId = searchParams.get("farmerId");

  let appName = "3T (Time To Time) Dairy";
  let shortName = "3T Dairy";
  let startUrl = "/";
  let scope = "/";
  let description = "Real-time quality-indexed dairy payment & micro-fintech ecosystem";

  if (farmerId) {
    let farmerName = "";
    try {
      const db = await getDb();
      const localFarmer = db.data.farmers.find(
        (f) => f.id.toUpperCase() === farmerId.toUpperCase()
      );
      if (localFarmer) {
        farmerName = localFarmer.name;
      } else {
        const { data: directFarmer } = await supabase
          .from("farmers")
          .select("name")
          .eq("id", farmerId)
          .single();
        if (directFarmer) {
          farmerName = directFarmer.name;
        }
      }
    } catch {
      // fallback
    }

    const titleName = farmerName ? farmerName : `Farmer ${farmerId}`;
    appName = `3T Passbook - ${titleName}`;
    shortName = farmerName ? `${farmerName.split(" ")[0]} Passbook` : "3T Passbook";
    startUrl = `/farmer/${farmerId}`;
    scope = `/farmer/${farmerId}`;
    description = `Digital Milk Passbook & Instant Ledger for ${titleName} (${farmerId})`;
  }

  const manifest = {
    name: appName,
    short_name: shortName,
    description: description,
    start_url: startUrl,
    scope: scope,
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F8FAF9",
    theme_color: "#0F8A5F",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
