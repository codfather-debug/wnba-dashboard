// 2025 Full Regular Season — 44 GP each
// Columns: GP, PTS, FGM, FGA, FG%, 3PM, 3PA, 3P%, FTM, FTA, FT%, OREB, DREB, REB, AST, STL, BLK, TOV, PF
const STAT_KEYS = ["GP","PTS","FGM","FGA","FG%","3PM","3PA","3P%","FTM","FTA","FT%","OREB","DREB","REB","AST","STL","BLK","TOV","PF"] as const;
export type StatKey = typeof STAT_KEYS[number];
export type StatMap = Record<StatKey, number>;

function rowToObj(arr: number[]): StatMap {
  return Object.fromEntries(STAT_KEYS.map((k, i) => [k, arr[i]])) as StatMap;
}

const RAW_OFF: [string, ...number[]][] = [
  ["Minnesota Lynx",         44,86.1,32.1,68.1,47.2, 9.6,25.4,37.8,12.2,16.1,76.0, 8.5,25.6,34.2,23.3,8.2,4.8,12.1,16.0],
  ["New York Liberty",       44,85.7,30.7,67.1,45.7, 8.6,25.6,33.7,15.7,20.4,76.9, 8.0,25.3,33.3,20.7,7.3,3.1,14.1,16.9],
  ["Las Vegas Aces",         44,84.9,31.4,68.8,45.6, 8.3,24.0,34.6,13.8,18.0,77.0, 8.8,24.6,33.4,20.6,7.7,2.8,12.8,18.6],
  ["Indiana Fever",          44,84.4,29.6,65.3,45.3, 9.5,26.8,35.5,15.6,18.7,83.7, 6.8,26.9,33.7,21.8,7.6,4.4,12.9,16.2],
  ["Seattle Storm",          44,84.4,30.1,67.8,44.3, 9.6,28.4,33.7,14.7,18.7,78.6, 8.9,27.7,36.6,21.4,6.8,4.5,11.2,15.8],
  ["Connecticut Sun",        44,83.6,29.7,67.6,43.9, 9.1,25.9,35.1,15.2,18.5,82.4, 8.1,25.4,33.5,19.6,7.5,4.9,11.9,16.6],
  ["Golden State Valkyries", 44,82.8,29.7,68.6,43.3, 9.4,27.7,34.0,13.9,17.8,78.4, 8.7,26.0,34.7,20.9,7.8,3.7,12.5,17.8],
  ["Phoenix Mercury",        44,82.1,31.1,69.2,45.0, 7.5,22.1,34.2,12.3,16.0,77.1, 6.9,24.0,30.9,21.3,8.5,5.1,11.6,17.1],
  ["Chicago Sky",            44,81.7,30.2,71.4,42.3, 6.6,21.6,30.4,14.8,18.4,80.2,10.0,25.3,35.4,20.2,7.3,4.0,12.8,18.9],
  ["Atlanta Dream",          44,77.7,26.5,65.2,40.7, 9.7,29.9,32.5,15.0,18.4,81.5, 8.7,26.6,35.3,18.5,6.8,2.9,12.9,17.5],
  ["Washington Mystics",     44,77.1,28.0,63.7,43.9, 5.6,17.1,32.9,15.6,20.7,75.4, 7.7,25.3,33.0,19.2,6.5,3.2,14.2,18.2],
  ["Los Angeles Sparks",     44,75.8,27.6,67.1,41.2, 6.2,20.4,30.2,14.5,18.2,79.3, 8.5,23.3,31.9,17.4,7.8,3.7,13.1,19.6],
  ["Dallas Wings",           44,75.8,28.0,66.0,42.5, 6.7,20.2,33.0,13.0,17.1,76.3, 9.8,25.7,35.5,19.3,6.0,4.2,15.5,17.8],
];

// Opponent stats: best defense (fewest pts allowed) first
const OPP_ORDER = [
  "New York Liberty","Las Vegas Aces","Minnesota Lynx","Connecticut Sun",
  "Seattle Storm","Phoenix Mercury","Indiana Fever","Golden State Valkyries",
  "Washington Mystics","Atlanta Dream","Chicago Sky","Los Angeles Sparks","Dallas Wings",
];
const RAW_OPP: number[][] = [
  [44,76.3,26.7,65.9,40.5,8.8,27.9,31.7,14.2,18.0,78.6,8.4,24.9,33.3,19.2,7.6,4.1,11.9,17.8],
  [44,76.7,28.4,67.3,42.3,7.8,23.7,33.1,12.0,15.4,77.5,9.0,24.3,33.3,18.8,6.7,2.8,14.0,16.4],
  [44,76.8,29.0,67.5,42.9,6.6,20.5,32.1,12.2,15.8,77.5,7.0,24.4,31.4,18.8,6.5,3.6,11.5,17.0],
  [44,80.1,29.3,67.0,43.7,8.2,24.3,33.7,13.4,17.2,77.6,7.9,25.2,33.1,19.5,7.2,3.7,13.1,17.9],
  [44,80.6,29.3,68.0,43.0,8.0,24.0,33.5,14.0,18.1,77.3,8.2,25.2,33.4,20.2,7.3,4.1,13.3,17.5],
  [44,80.7,29.0,67.0,43.2,8.4,25.5,33.1,14.2,18.4,77.0,8.6,24.9,33.5,20.2,7.4,3.9,12.8,18.1],
  [44,81.3,29.7,67.4,44.1,8.3,24.5,33.8,13.5,17.4,77.8,8.1,25.1,33.2,19.8,7.6,3.8,12.7,17.7],
  [44,82.2,30.0,67.9,44.2,8.5,25.1,33.8,13.7,17.7,77.4,8.3,25.5,33.8,20.5,7.5,4.0,13.0,18.0],
  [44,82.9,30.4,68.1,44.6,8.3,24.8,33.3,13.8,17.9,77.1,8.5,25.3,33.8,20.4,7.4,3.9,13.2,17.8],
  [44,83.5,30.3,68.4,44.3,8.5,25.6,33.1,14.4,18.6,77.5,8.7,25.5,34.2,20.6,7.6,3.8,13.4,18.1],
  [44,84.7,30.8,68.2,45.1,8.8,25.8,34.1,14.3,18.4,77.8,8.4,25.7,34.1,20.8,7.5,4.0,13.4,17.8],
  [44,85.5,31.3,68.6,45.6,8.9,26.3,33.9,14.1,18.3,77.3,8.5,25.8,34.3,21.1,7.5,4.0,13.3,17.9],
  [44,86.8,31.8,68.8,46.2,9.0,26.6,33.8,14.3,18.5,77.5,8.7,26.1,34.8,21.3,7.6,4.1,13.4,18.0],
];

const oppByTeam: Record<string, StatMap> = {};
RAW_OPP.forEach((row, i) => { oppByTeam[OPP_ORDER[i]] = rowToObj(row); });

export const TEAM_COLORS: Record<string, { color: string; alt: string }> = {
  "Minnesota Lynx":         { color: "#236192", alt: "#78BE20" },
  "New York Liberty":       { color: "#86CEBC", alt: "#000000" },
  "Las Vegas Aces":         { color: "#C8102E", alt: "#111111" },
  "Indiana Fever":          { color: "#002D62", alt: "#E13A3E" },
  "Seattle Storm":          { color: "#2C5234", alt: "#FEA30B" },
  "Connecticut Sun":        { color: "#F05023", alt: "#1D3461" },
  "Golden State Valkyries": { color: "#FDB927", alt: "#1D428A" },
  "Phoenix Mercury":        { color: "#E56020", alt: "#201747" },
  "Chicago Sky":            { color: "#5091CD", alt: "#FFCD00" },
  "Atlanta Dream":          { color: "#C8102E", alt: "#041E42" },
  "Washington Mystics":     { color: "#C8102E", alt: "#0C2340" },
  "Los Angeles Sparks":     { color: "#702F8A", alt: "#FDB927" },
  "Dallas Wings":           { color: "#002B5C", alt: "#C4D600" },
  "Portland Fire":          { color: "#CE1141", alt: "#000000" },
  "Toronto Tempo":          { color: "#B4975A", alt: "#061922" },
};

export interface Team {
  team: string;
  off: StatMap;
  opp: StatMap;
  color: string;
  alt: string;
}

export const TEAMS: Team[] = RAW_OFF.map(([team, ...rest]) => ({
  team: team as string,
  off: rowToObj(rest as number[]),
  opp: oppByTeam[team as string] ?? rowToObj(new Array(19).fill(0)),
  color: TEAM_COLORS[team as string]?.color ?? "#475569",
  alt:   TEAM_COLORS[team as string]?.alt   ?? "#1e293b",
}));

export const ESPN_NAME_MAP: Record<string, string> = {
  "New York Liberty": "New York Liberty",
  "Phoenix Mercury": "Phoenix Mercury",
  "Minnesota Lynx": "Minnesota Lynx",
  "Indiana Fever": "Indiana Fever",
  "Las Vegas Aces": "Las Vegas Aces",
  "Seattle Storm": "Seattle Storm",
  "Connecticut Sun": "Connecticut Sun",
  "Golden State Valkyries": "Golden State Valkyries",
  "Chicago Sky": "Chicago Sky",
  "Atlanta Dream": "Atlanta Dream",
  "Washington Mystics": "Washington Mystics",
  "Los Angeles Sparks": "Los Angeles Sparks",
  "Dallas Wings": "Dallas Wings",
  "Portland Fire": "Portland Fire",
  "Toronto Tempo": "Toronto Tempo",
};

export interface ColDef {
  key: StatKey;
  label: string;
  desc: string;
  offHiB: boolean;
  oppHiB: boolean;
}

export const COLS: ColDef[] = [
  { key:"PTS",  label:"PTS",  desc:"Points/G",    offHiB:true,  oppHiB:false },
  { key:"REB",  label:"REB",  desc:"Rebounds/G",  offHiB:true,  oppHiB:false },
  { key:"AST",  label:"AST",  desc:"Assists/G",   offHiB:true,  oppHiB:false },
  { key:"3PM",  label:"3PM",  desc:"3PM/G",       offHiB:true,  oppHiB:false },
  { key:"3PA",  label:"3PA",  desc:"3PA/G",       offHiB:true,  oppHiB:false },
  { key:"3P%",  label:"3P%",  desc:"3-Pt%",       offHiB:true,  oppHiB:false },
  { key:"FG%",  label:"FG%",  desc:"FG%",         offHiB:true,  oppHiB:false },
  { key:"FT%",  label:"FT%",  desc:"FT%",         offHiB:true,  oppHiB:false },
  { key:"OREB", label:"OREB", desc:"Off Reb/G",   offHiB:true,  oppHiB:false },
  { key:"STL",  label:"STL",  desc:"Steals/G",    offHiB:true,  oppHiB:true  },
  { key:"BLK",  label:"BLK",  desc:"Blocks/G",    offHiB:true,  oppHiB:true  },
  { key:"TOV",  label:"TOV",  desc:"Turnovers/G", offHiB:false, oppHiB:true  },
];

export const MATCHUP_COLS: ColDef[] = COLS.filter(c =>
  ["PTS","FG%","3PM","3PA","3P%","REB","OREB","AST","TOV"].includes(c.key)
);

export function buildRanks(teams: Team[], getVal: (t: Team) => number, hiB: boolean): Record<string, number> {
  const sorted = [...teams].sort((a, b) => hiB ? getVal(b) - getVal(a) : getVal(a) - getVal(b));
  return Object.fromEntries(sorted.map((t, i) => [t.team, i + 1]));
}

export function rankColor(rank: number, total: number): string {
  const p = 1 - (rank - 1) / Math.max(total - 1, 1);
  if (p >= 0.75) return "#4ade80";
  if (p >= 0.5)  return "#86efac";
  if (p >= 0.25) return "#fbbf24";
  return "#f87171";
}

export function fmt(val: number | undefined, key: string): string {
  if (val == null || isNaN(+val)) return "—";
  if (["FG%","3P%","FT%"].includes(key)) return (+val).toFixed(1) + "%";
  return (+val).toFixed(1);
}

// Precompute all ranks once
export const OFF_RANKS: Record<string, Record<string, number>> = Object.fromEntries(
  COLS.map(({ key, offHiB }) => [key, buildRanks(TEAMS, t => t.off[key] ?? 0, offHiB)])
);
export const OPP_RANKS: Record<string, Record<string, number>> = Object.fromEntries(
  COLS.map(({ key, oppHiB }) => [key, buildRanks(TEAMS, t => t.opp[key] ?? 0, oppHiB)])
);
export const TOTAL = TEAMS.length;
