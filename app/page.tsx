"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TEAMS, COLS, MATCHUP_COLS, TEAM_COLORS, ESPN_NAME_MAP,
  OFF_RANKS, OPP_RANKS, TOTAL, rankColor, fmt,
  type Team, type StatKey,
} from "./data";

interface GameTeam { displayName: string; abbr: string; score: string | null; color: string; }
interface Game {
  id: string; name: string; date: string;
  status: string; statusDetail: string; venue: string;
  home: GameTeam; away: GameTeam;
}

const teamByName = Object.fromEntries(TEAMS.map(t => [t.team, t]));
function getTeam(displayName: string): Team | undefined {
  return teamByName[ESPN_NAME_MAP[displayName] ?? displayName];
}

const mono: React.CSSProperties = { fontFamily: "'DM Mono','Courier New',monospace" };

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      background: active ? "linear-gradient(135deg,#f97316,#ec4899)" : "transparent",
      border: active ? "none" : "1px solid #2d2d4e",
      color: active ? "#fff" : "#64748b",
      padding: "7px 18px", borderRadius: 6, cursor: "pointer",
      fontSize: 11, letterSpacing: 1, fontWeight: active ? 700 : 400,
      textTransform: "uppercase", ...mono,
    }}>{children}</button>
  );
}

function ViewBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      background: active ? "#1e293b" : "transparent",
      border: "1px solid #2d2d4e",
      color: active ? "#f1f5f9" : "#64748b",
      padding: "5px 13px", borderRadius: 6, cursor: "pointer",
      fontSize: 10, letterSpacing: 1, textTransform: "uppercase", ...mono,
    }}>{children}</button>
  );
}

type StatSide = "off" | "def";

// Small toggle pill: OFF | DEF
function SideToggle({ value, onChange, color }: { value: StatSide; onChange: (s: StatSide) => void; color: string }) {
  const base: React.CSSProperties = { padding: "3px 10px", fontSize: 9, fontWeight: 700, letterSpacing: 1, cursor: "pointer", border: "none", ...mono };
  return (
    <div style={{ display: "inline-flex", borderRadius: 5, overflow: "hidden", border: "1px solid #2d2d4e" }}>
      <button onClick={() => onChange("off")} style={{
        ...base,
        background: value === "off" ? color : "#0d0d1a",
        color: value === "off" ? "#000" : "#475569",
      }}>OFF</button>
      <button onClick={() => onChange("def")} style={{
        ...base,
        background: value === "def" ? color : "#0d0d1a",
        color: value === "def" ? "#000" : "#475569",
        borderLeft: "1px solid #2d2d4e",
      }}>DEF</button>
    </div>
  );
}

// ── Matchup Card ──────────────────────────────────────────────────────────────
function MatchupCard({ game }: { game: Game }) {
  const [open, setOpen] = useState(true);
  const [awaySide, setAwaySide] = useState<StatSide>("off");
  const [homeSide, setHomeSide] = useState<StatSide>("def");

  const awayTeam = getTeam(game.away.displayName);
  const homeTeam = getTeam(game.home.displayName);
  const awayColors = TEAM_COLORS[ESPN_NAME_MAP[game.away.displayName] ?? ""] ?? { color: "#f97316", alt: "#1e293b" };
  const homeColors = TEAM_COLORS[ESPN_NAME_MAP[game.home.displayName] ?? ""] ?? { color: "#ec4899", alt: "#1e293b" };

  const isLive = game.status === "In Progress" || game.statusDetail?.includes("Q") || game.statusDetail?.includes("Half");
  const isFinal = game.status === "Final";
  const gameTime = new Date(game.date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZoneName: "short" });

  const getStats  = (team: Team, side: StatSide) => side === "off" ? team.off : team.opp;
  const getRank   = (key: StatKey, teamName: string, side: StatSide) =>
    side === "off" ? OFF_RANKS[key]?.[teamName] : OPP_RANKS[key]?.[teamName];

  // Is the away value "better" than home for this specific combo of sides?
  const getBetter = (key: StatKey, awayVal: number, homeVal: number): "away" | "home" | "even" => {
    if (Math.abs(awayVal - homeVal) < 0.05) return "even";
    const col = MATCHUP_COLS.find(c => c.key === key);
    // When comparing off vs def (or any mix), we want to know which number is higher/lower
    // For scoring stats (PTS, REB, AST, 3PM, 3PA, 3P%, FG%, OREB): higher = better for OFF, lower = better for DEF
    // For TOV: lower = better for OFF, higher = better for DEF (you want opp to turn it over more)
    // Simplest rule: use the side of the LEFT column to determine directionality
    const hiB = awaySide === "off" ? (col?.offHiB ?? true) : (col?.oppHiB ?? false);
    return hiB ? (awayVal > homeVal ? "away" : "home") : (awayVal < homeVal ? "away" : "home");
  };

  const sideLabel = (side: StatSide) => side === "off" ? "OFFENSE" : "DEFENSE";
  const sideDesc  = (side: StatSide) => side === "off" ? "points/stats scored" : "points/stats allowed";

  return (
    <div style={{ background: "#0d0d1a", border: "1px solid #1e1e3a", borderRadius: 10, overflow: "hidden", marginBottom: 14, ...mono }}>

      {/* Game header */}
      <div onClick={() => setOpen(o => !o)} style={{ cursor: "pointer", padding: "14px 18px", background: "#0a0a16", borderBottom: open ? "1px solid #1e1e3a" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={`https://a.espncdn.com/i/teamlogos/wnba/500/${game.away.abbr.toLowerCase()}.png`}
                style={{ width: 34, height: 34, objectFit: "contain" }} alt=""
                onError={(e) => (e.currentTarget.style.display = "none")} />
              <div>
                <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 13 }}>{game.away.displayName}</div>
                <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1 }}>AWAY</div>
              </div>
              {(isLive || isFinal) && <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", minWidth: 30, textAlign: "right" }}>{game.away.score ?? "—"}</div>}
            </div>
            <div style={{ color: "#2d2d4e", fontSize: 13, fontWeight: 700 }}>@</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {(isLive || isFinal) && <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", minWidth: 30 }}>{game.home.score ?? "—"}</div>}
              <div>
                <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 13 }}>{game.home.displayName}</div>
                <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1 }}>HOME</div>
              </div>
              <img src={`https://a.espncdn.com/i/teamlogos/wnba/500/${game.home.abbr.toLowerCase()}.png`}
                style={{ width: 34, height: 34, objectFit: "contain" }} alt=""
                onError={(e) => (e.currentTarget.style.display = "none")} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <div style={{
              display: "inline-block", borderRadius: 4, padding: "3px 9px", fontSize: 9, fontWeight: 700, letterSpacing: 1,
              background: isLive ? "#14532d" : isFinal ? "#1e293b" : "#1e1e3a",
              color: isLive ? "#4ade80" : isFinal ? "#64748b" : "#94a3b8",
            }}>
              {isLive ? `🔴 ${game.statusDetail}` : isFinal ? "FINAL" : gameTime}
            </div>
            {game.venue && <div style={{ fontSize: 9, color: "#334155" }}>{game.venue}</div>}
            <div style={{ fontSize: 9, color: "#334155" }}>{open ? "▲ collapse" : "▼ expand"}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding: "14px 18px" }}>
          {(!awayTeam || !homeTeam) ? (
            <div style={{ color: "#475569", fontSize: 11, textAlign: "center", padding: 20 }}>
              No 2025 season data for one or both teams.
            </div>
          ) : (
            <>
              {/* Comparison table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#080810" }}>
                      {/* Away header with toggle */}
                      <th style={{ padding: "10px 14px", textAlign: "left", borderBottom: "2px solid #1e1e3a", minWidth: 160 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 3, height: 28, borderRadius: 2, background: awayColors.color, flexShrink: 0 }} />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ color: awayColors.color, fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>{game.away.abbr}</span>
                              <SideToggle value={awaySide} onChange={setAwaySide} color={awayColors.color} />
                            </div>
                            <div style={{ color: "#334155", fontSize: 8, letterSpacing: 1 }}>{sideDesc(awaySide)}</div>
                          </div>
                        </div>
                      </th>

                      {/* Stat label */}
                      <th style={{ padding: "10px 12px", textAlign: "center", borderBottom: "2px solid #1e1e3a", color: "#334155", fontSize: 9, letterSpacing: 1, fontWeight: 600, minWidth: 60 }}>
                        STAT
                      </th>

                      {/* Home header with toggle */}
                      <th style={{ padding: "10px 14px", textAlign: "right", borderBottom: "2px solid #1e1e3a", minWidth: 160 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, justifyContent: "flex-end" }}>
                              <SideToggle value={homeSide} onChange={setHomeSide} color={homeColors.color} />
                              <span style={{ color: homeColors.color, fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>{game.home.abbr}</span>
                            </div>
                            <div style={{ color: "#334155", fontSize: 8, letterSpacing: 1 }}>{sideDesc(homeSide)}</div>
                          </div>
                          <div style={{ width: 3, height: 28, borderRadius: 2, background: homeColors.color, flexShrink: 0 }} />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MATCHUP_COLS.map(({ key, label, desc }, i) => {
                      const awayVal = getStats(awayTeam, awaySide)[key] ?? 0;
                      const homeVal = getStats(homeTeam, homeSide)[key] ?? 0;
                      const awayRank = getRank(key, awayTeam.team, awaySide);
                      const homeRank = getRank(key, homeTeam.team, homeSide);
                      const better = getBetter(key, awayVal, homeVal);
                      const maxVal = Math.max(awayVal, homeVal, 0.01);
                      const awayPct = Math.round((awayVal / maxVal) * 100);
                      const homePct = Math.round((homeVal / maxVal) * 100);

                      return (
                        <tr key={key} style={{ background: i % 2 === 0 ? "#08080d" : "#0a0a12", borderBottom: "1px solid #111118" }}>
                          {/* Away value + bar */}
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ minWidth: 56, textAlign: "right" }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: better === "away" ? "#4ade80" : rankColor(awayRank, TOTAL) }}>
                                  {fmt(awayVal, key)}
                                  {better === "away" && <span style={{ fontSize: 9, marginLeft: 3, color: "#4ade80" }}>▲</span>}
                                </div>
                                <div style={{ fontSize: 8, color: "#334155" }}>#{awayRank} league</div>
                              </div>
                              <div style={{ flex: 1, height: 6, background: "#111118", borderRadius: 3, overflow: "hidden", display: "flex", justifyContent: "flex-end" }}>
                                <div style={{ height: "100%", width: `${awayPct}%`, background: better === "away" ? "#4ade80" : awayColors.color, borderRadius: 3, opacity: 0.85 }} />
                              </div>
                            </div>
                          </td>

                          {/* Stat label */}
                          <td style={{ padding: "10px 6px", textAlign: "center" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1 }}>{label}</div>
                            <div style={{ fontSize: 8, color: "#1e293b", marginTop: 1 }}>{desc}</div>
                          </td>

                          {/* Home bar + value */}
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ flex: 1, height: 6, background: "#111118", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${homePct}%`, background: better === "home" ? "#4ade80" : homeColors.color, borderRadius: 3, opacity: 0.85 }} />
                              </div>
                              <div style={{ minWidth: 56 }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: better === "home" ? "#4ade80" : rankColor(homeRank, TOTAL) }}>
                                  {better === "home" && <span style={{ fontSize: 9, marginRight: 3, color: "#4ade80" }}>▲</span>}
                                  {fmt(homeVal, key)}
                                </div>
                                <div style={{ fontSize: 8, color: "#334155", textAlign: "right" }}>#{homeRank} league</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 8, fontSize: 8, color: "#334155", letterSpacing: 1, display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span><span style={{ color: "#4ade80" }}>▲</span> = BETTER VALUE IN THIS MATCHUP</span>
                <span>RANK OUT OF {TOTAL} TEAMS · 2025 FULL SEASON</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stats Table ───────────────────────────────────────────────────────────────
function StatsTable() {
  const [view, setView] = useState<"offense"|"defense"|"split">("offense");
  const [sortKey, setSortKey] = useState<StatKey>("PTS");
  const [sortDir, setSortDir] = useState<"desc"|"asc">("desc");
  const [selected, setSelected] = useState<Team | null>(null);

  const col = COLS.find(c => c.key === sortKey);
  const sorted = useMemo(() => {
    const hiB = col ? (view === "defense" ? col.oppHiB : col.offHiB) : true;
    return [...TEAMS].sort((a, b) => {
      const av = view === "defense" ? (a.opp[sortKey] ?? 0) : (a.off[sortKey] ?? 0);
      const bv = view === "defense" ? (b.opp[sortKey] ?? 0) : (b.off[sortKey] ?? 0);
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [sortKey, sortDir, view, col]);

  const handleSort = (k: StatKey) => {
    if (k === sortKey) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  return (
    <div style={mono}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <ViewBtn active={view === "offense"} onClick={() => setView("offense")}>OFFENSE</ViewBtn>
          <ViewBtn active={view === "defense"} onClick={() => setView("defense")}>OPP DEF</ViewBtn>
          <ViewBtn active={view === "split"}   onClick={() => setView("split")}>SPLIT</ViewBtn>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 9, color: "#334155", letterSpacing: 1, alignItems: "center" }}>
          {([["#4ade80","TOP 25%"],["#86efac","50%"],["#fbbf24","BOT 50%"],["#f87171","BOT 25%"]] as [string,string][]).map(([c,l]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 8, height: 8, background: c, borderRadius: 2, display: "inline-block" }} />{l}
            </span>
          ))}
          {view === "split" && <><span style={{ color: "#f97316" }}>TOP=OFF</span><span style={{ color: "#ec4899" }}>BTM=OPP</span></>}
        </div>
      </div>
      <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #151520" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#0d0d1a" }}>
              <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", letterSpacing: 1, fontWeight: 600, borderBottom: "1px solid #1a1a2e", minWidth: 180, ...mono }}>TEAM</th>
              {COLS.map(({ key, label }) => (
                <th key={key} onClick={() => handleSort(key)} style={{
                  padding: "10px 7px", textAlign: "center", cursor: "pointer",
                  color: sortKey === key ? "#f97316" : "#475569",
                  letterSpacing: 1, fontWeight: 600, borderBottom: "1px solid #1a1a2e",
                  whiteSpace: "nowrap", minWidth: 52, background: sortKey === key ? "#0d0d1a" : "transparent", ...mono,
                }}>
                  {label}{sortKey === key ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const isSel = selected?.team === row.team;
              return (
                <tr key={row.team} onClick={() => setSelected(isSel ? null : row)}
                  style={{ background: isSel ? "#0f0f2a" : i % 2 === 0 ? "#08080d" : "#0a0a12", borderBottom: "1px solid #111118", cursor: "pointer" }}
                  onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = "#0d0d1c"; }}
                  onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "#08080d" : "#0a0a12"; }}
                >
                  <td style={{ padding: "8px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 3, height: 22, borderRadius: 2, background: `linear-gradient(180deg,${row.color},${row.alt})`, flexShrink: 0 }} />
                      <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 11, ...mono }}>{row.team}</div>
                    </div>
                  </td>
                  {COLS.map(({ key }) => {
                    const offV = row.off[key], oppV = row.opp[key];
                    const offR = OFF_RANKS[key]?.[row.team], oppR = OPP_RANKS[key]?.[row.team];
                    if (view === "offense") return <td key={key} style={{ padding: "8px 7px", textAlign: "center", ...mono }}><div style={{ color: rankColor(offR, TOTAL), fontWeight: 600 }}>{fmt(offV, key)}</div><div style={{ fontSize: 8, color: "#1e293b" }}>#{offR}</div></td>;
                    if (view === "defense") return <td key={key} style={{ padding: "8px 7px", textAlign: "center", ...mono }}><div style={{ color: rankColor(oppR, TOTAL), fontWeight: 600 }}>{fmt(oppV, key)}</div><div style={{ fontSize: 8, color: "#1e293b" }}>#{oppR}</div></td>;
                    return <td key={key} style={{ padding: "4px 7px", textAlign: "center", ...mono }}><div style={{ color: rankColor(offR, TOTAL), fontWeight: 600, fontSize: 10 }}>{fmt(offV, key)}</div><div style={{ color: rankColor(oppR, TOTAL), fontWeight: 600, fontSize: 10 }}>{fmt(oppV, key)}</div></td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected && (
        <div style={{ marginTop: 14, background: "#0d0d1a", border: `1px solid ${selected.color}44`, borderRadius: 10, padding: 18, ...mono }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 4, height: 32, borderRadius: 2, background: `linear-gradient(180deg,${selected.color},${selected.alt})` }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{selected.team}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "1px solid #1e1e3a", color: "#64748b", padding: "3px 9px", borderRadius: 5, cursor: "pointer", fontSize: 10, ...mono }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8 }}>
            {COLS.map(({ key, label, desc }) => {
              const offR = OFF_RANKS[key]?.[selected.team], oppR = OPP_RANKS[key]?.[selected.team];
              return (
                <div key={key} style={{ background: "#07070e", borderRadius: 6, padding: "10px 11px", border: "1px solid #111118" }}>
                  <div style={{ fontSize: 8, color: "#334155", letterSpacing: 1, marginBottom: 5 }}>{label} · {desc}</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div><div style={{ fontSize: 7, color: "#f97316" }}>OFF</div><div style={{ fontSize: 14, fontWeight: 700, color: rankColor(offR, TOTAL) }}>{fmt(selected.off[key], key)}</div><div style={{ fontSize: 7, color: "#1e293b" }}>#{offR}</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 7, color: "#ec4899" }}>OPP</div><div style={{ fontSize: 14, fontWeight: 700, color: rankColor(oppR, TOTAL) }}>{fmt(selected.opp[key], key)}</div><div style={{ fontSize: 7, color: "#1e293b" }}>#{oppR}</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Page() {
  const [tab, setTab] = useState<"matchups"|"stats">("matchups");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const loadGames = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/scoreboard");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGames(data.games ?? []);
      setLastFetch(new Date());
    } catch (e: any) {
      setError(e.message ?? "Failed to load schedule");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadGames();
    const id = setInterval(loadGames, 60_000);
    return () => clearInterval(id);
  }, [loadGames]);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "#07070e", color: "#e2e8f0", ...mono }}>
      <div style={{ background: "linear-gradient(135deg,#0d0d1f,#1a0a2e,#0d0d1f)", borderBottom: "1px solid #1e1e3a", padding: "18px 24px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
              <span style={{ background: "linear-gradient(135deg,#f97316,#ec4899)", borderRadius: 5, padding: "4px 9px", fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#fff" }}>WNBA</span>
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, color: "#f1f5f9" }}>TEAM STATS</span>
            </div>
            <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1 }}>2025 FULL REGULAR SEASON · ESPN</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <TabBtn active={tab === "matchups"} onClick={() => setTab("matchups")}>📅 Matchups</TabBtn>
            <TabBtn active={tab === "stats"}    onClick={() => setTab("stats")}>📊 Team Stats</TabBtn>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "18px 16px" }}>
        {tab === "matchups" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{today}</div>
                <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1, marginTop: 2 }}>
                  {loading ? "LOADING…" : `${games.length} GAME${games.length !== 1 ? "S" : ""} · 2025 SEASON DATA`}
                  {lastFetch && !loading && ` · ${lastFetch.toLocaleTimeString()}`}
                </div>
              </div>
              <button onClick={loadGames} disabled={loading} style={{ background: "transparent", border: "1px solid #2d2d4e", color: "#64748b", padding: "5px 13px", borderRadius: 6, cursor: "pointer", fontSize: 10, letterSpacing: 1, ...mono }}>
                {loading ? "⟳ LOADING…" : "↺ REFRESH"}
              </button>
            </div>
            {loading && <div style={{ textAlign: "center", padding: 60, color: "#475569" }}><div style={{ fontSize: 28, marginBottom: 10 }}>⟳</div><div style={{ fontSize: 11, letterSpacing: 2 }}>LOADING…</div></div>}
            {error && !loading && (
              <div style={{ background: "#130a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: 20, color: "#fca5a5", fontSize: 11, textAlign: "center" }}>
                ⚠ {error}<br /><br />
                <button onClick={loadGames} style={{ background: "transparent", border: "1px solid #7f1d1d", color: "#fca5a5", padding: "5px 12px", borderRadius: 5, cursor: "pointer", fontSize: 10, ...mono }}>Try Again</button>
              </div>
            )}
            {!loading && !error && games.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🏀</div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>No WNBA games today.</div>
                <div style={{ fontSize: 10, color: "#334155" }}>Check back on a game day.</div>
              </div>
            )}
            {!loading && games.map(g => <MatchupCard key={g.id} game={g} />)}
          </div>
        )}
        {tab === "stats" && <StatsTable />}
      </div>
    </div>
  );
}
