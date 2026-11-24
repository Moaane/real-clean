import { getActivePackages } from "@/lib/katalog";
import { toPackageDTO } from "@/lib/paket-dto";

// Public catalog (no user data), so the CDN may cache it briefly.
export async function GET() {
  const pkg = await getActivePackages();
  return Response.json(
    { packages: pkg.map(toPackageDTO) },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
