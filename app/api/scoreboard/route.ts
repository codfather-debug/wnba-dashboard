import { NextResponse } from "next/server";

export async function GET() {
  const today = new Date();
  const ymd = today.toISOString().slice(0, 10).replace(/-/g, "");
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard?dates=${ymd}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
    const data = await res.json();

    const games = (data.events || []).map((evt: any) => {
      const comp = evt.competitions[0];
      const competitors: any[] = comp.competitors;
      const home = competitors.find((c: any) => c.homeAway === "home");
      const away = competitors.find((c: any) => c.homeAway === "away");
      return {
        id: evt.id,
        name: evt.name,
        date: evt.date,
        status: comp.status?.type?.description ?? "Scheduled",
        statusDetail: comp.status?.type?.shortDetail ?? "",
        venue: comp.venue?.fullName ?? "",
        home: {
          displayName: home?.team?.displayName ?? "",
          abbr: home?.team?.abbreviation ?? "",
          score: home?.score ?? null,
          color: home?.team?.color ?? "475569",
        },
        away: {
          displayName: away?.team?.displayName ?? "",
          abbr: away?.team?.abbreviation ?? "",
          score: away?.score ?? null,
          color: away?.team?.color ?? "475569",
        },
      };
    });

    return NextResponse.json({ games, date: ymd });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
