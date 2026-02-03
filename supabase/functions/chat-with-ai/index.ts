// NOTE: This runs in Deno (Supabase Edge Functions). VS Code's TS server in a Node workspace
// may not know Deno types, so we declare the minimal bits we use to remove editor errors.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore - Deno supports URL imports; VS Code TS may not resolve them in non-Deno workspaces.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatRequest {
  chatId: string;
  message: string;
  game: "valorant" | "league";
  team?: string;
  isFirstTeamMention?: boolean;
  conversationHistory: { role: string; content: string }[];
}

interface TeamMetrics {
  teamId: string;
  teamName: string;
  logoUrl?: string;
  seriesCount: number;
  totalRounds: number;
  avgRoundSeconds: number | null;
  attackWinRate: number | null;
  defenseWinRate: number | null;
  firstBloodRate: number | null;
  firstBloodConversion: number | null;
  pistolWinRate: number | null;
  mapWinRate: number | null;
  mapWinRates: Record<string, number>;
  agentPickRates: Record<string, number> | null;
  roleDistribution: Record<string, number> | null;
  topCompositions: { comp: string[]; count: number }[] | null;
  topFirstBloodPlayers: { player: string; count: number }[] | null;
  signals: {
    strongMaps: string[];
    weakMaps: string[];
    sideBias: "attack" | "defense" | null;
    strongEarlyGame: boolean;
    weakPistols: boolean;
  };
  recentForm: {
    wins: number;
    losses: number;
    streak: "win" | "loss" | null;
  };
  players: { id: string; name: string; agent?: string }[];
}

interface ScoutingReport {
  teamId: string;
  teamName: string;
  logoUrl?: string;
  report: string;
  metrics?: {
    agg: {
      seriesCount: number;
      totalRounds: number;
      attackWinRate: number | null;
      defenseWinRate: number | null;
      firstBloodRate: number | null;
      firstBloodConversion: number | null;
      pistolWinRate: number | null;
      mapWinRate: number | null;
      mapWinRates: Record<string, number>;
      agentPickRates: Record<string, number> | null;
      roleDistribution: Record<string, number> | null;
    };
    signals: TeamMetrics["signals"];
    recentForm: TeamMetrics["recentForm"];
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // This function is intended to be called via POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      message,
      game,
      team,
      isFirstTeamMention = false,
      conversationHistory = [],
    } = (body ?? {}) as Partial<ChatRequest>;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'message'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (game !== "valorant" && game !== "league") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'game'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const safeHistory = Array.isArray(conversationHistory)
      ? conversationHistory
      : [];

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GRID_API_KEY = Deno.env.get("GRID_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    let scoutingReport: ScoutingReport | null = null;
    let gridMetrics: TeamMetrics | null = null;

    // If team is mentioned and it's the first time, fetch GRID data
    if (team && isFirstTeamMention && GRID_API_KEY) {
      try {
        console.log(`Fetching GRID data for team: ${team}`);
        gridMetrics = await fetchGridTeamData(team, game, GRID_API_KEY);
        if (gridMetrics) {
          console.log(
            `Successfully fetched GRID metrics for ${team}:`,
            JSON.stringify(gridMetrics, null, 2)
          );
        } else {
          console.log(`No GRID data found for team: ${team}`);
        }
      } catch (error) {
        console.error("Error fetching GRID data:", error);
      }
    }

    // Build the system prompt
    const gameContext =
      game === "league" ? "League of Legends esports" : "Valorant esports";

    const gameName = game === "league" ? "League of Legends" : "Valorant";

    // Only introduce yourself on the very first message (no conversation history)
    const isFirstMessage = safeHistory.length === 0;

    let systemPrompt = `You are Stratik, a tactical esports analyst AI specializing in ${gameContext}. 

${
  isFirstMessage
    ? `FIRST MESSAGE: Briefly introduce yourself as Stratik in ONE short sentence, then answer the user's question. Do NOT repeat this introduction in any subsequent messages.`
    : `IMPORTANT: Do NOT introduce yourself or say "I'm Stratik" - you've already done that. Just answer the question directly and concisely.`
}

WHAT YOU CAN HELP WITH:
You can answer ANY question related to ${gameName}, including:
- Esports: teams, players, tournaments, match stats, scouting reports
- Gameplay: how to play, strategies, tips for improvement, mechanics, agent/champion guides
- General knowledge: what is ${gameName}, game modes, maps, lore, updates
- Improvement advice: how to get better, rank up, improve aim, game sense, team coordination
- Comparisons: team strengths, player comparisons, meta analysis

You should have natural conversations about ${gameName}. If someone asks "how do I become as good as them?" after discussing a team, help them with improvement tips. Follow-up questions in context are always welcome.

WHAT YOU CANNOT HELP WITH:
Only decline if the topic is COMPLETELY unrelated to ${gameName} or ${game === "league" ? "League of Legends" : "Valorant"} (e.g., cooking recipes, politics, other games like Fortnite or CS2).
Politely redirect: "I specialize in ${gameName}—what would you like to know about the game?"

DATA SOURCES:
- Primary source for esports stats: GRID.gg Central Data API
- When metrics are provided, cite specific statistics
- For gameplay advice, use your knowledge of the game

Key guidelines:
- Be helpful, friendly, and conversational
- Use esports/gaming terminology appropriately
- Cite specific GRID stats when provided for esports questions
- Provide actionable insights and tips

Game: ${gameName}
`;

    // Add special instructions for first team mention
    if (team && isFirstTeamMention) {
      systemPrompt += `
IMPORTANT: The user is asking about team "${team}" for the FIRST TIME in this conversation.
Generate a comprehensive scouting report including:
1. Playstyle Summary (based on side bias, round duration, agent preferences)
2. Key Strengths (cite specific win rates and metrics)
3. Weaknesses to Exploit (cite specific weak maps, pistol rates, etc.)
4. Notable Players (especially first blood threats)
5. Counter Strategies (based on their composition preferences and tendencies)

After this initial report, future questions about "${team}" should be more concise.
`;

      if (gridMetrics) {
        systemPrompt += `
=== GRID.gg REAL MATCH DATA for ${team} ===

TEAM INFO:
- Team ID: ${gridMetrics.teamId}
- Team Name: ${gridMetrics.teamName}

MATCH STATISTICS (from ${gridMetrics.seriesCount} recent series, ${
          gridMetrics.totalRounds
        } total rounds):
- Attack Win Rate: ${
          gridMetrics.attackWinRate
            ? (gridMetrics.attackWinRate * 100).toFixed(1) + "%"
            : "N/A"
        }
- Defense Win Rate: ${
          gridMetrics.defenseWinRate
            ? (gridMetrics.defenseWinRate * 100).toFixed(1) + "%"
            : "N/A"
        }
- First Blood Rate: ${
          gridMetrics.firstBloodRate
            ? (gridMetrics.firstBloodRate * 100).toFixed(1) + "%"
            : "N/A"
        }
- First Blood Conversion: ${
          gridMetrics.firstBloodConversion
            ? (gridMetrics.firstBloodConversion * 100).toFixed(1) + "%"
            : "N/A"
        } (when they get FB, how often they win)
- Pistol Round Win Rate: ${
          gridMetrics.pistolWinRate
            ? (gridMetrics.pistolWinRate * 100).toFixed(1) + "%"
            : "N/A"
        }
- Overall Map Win Rate: ${
          gridMetrics.mapWinRate
            ? (gridMetrics.mapWinRate * 100).toFixed(1) + "%"
            : "N/A"
        }
- Avg Round Duration: ${
          gridMetrics.avgRoundSeconds
            ? gridMetrics.avgRoundSeconds.toFixed(1) + "s"
            : "N/A"
        }

MAP-SPECIFIC WIN RATES:
${
  Object.entries(gridMetrics.mapWinRates || {})
    .map(([map, rate]) => `- ${map}: ${(rate * 100).toFixed(1)}%`)
    .join("\n") || "No map data available"
}

AGENT PICK RATES:
${
  gridMetrics.agentPickRates
    ? Object.entries(gridMetrics.agentPickRates)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([agent, rate]) => `- ${agent}: ${(rate * 100).toFixed(1)}%`)
        .join("\n")
    : "No agent data available"
}

ROLE DISTRIBUTION:
${
  gridMetrics.roleDistribution
    ? Object.entries(gridMetrics.roleDistribution)
        .map(([role, rate]) => `- ${role}: ${(rate * 100).toFixed(1)}%`)
        .join("\n")
    : "No role data available"
}

TOP COMPOSITIONS:
${
  gridMetrics.topCompositions
    ? gridMetrics.topCompositions
        .map((c, i) => `${i + 1}. ${c.comp.join(", ")} (${c.count} maps)`)
        .join("\n")
    : "No composition data available"
}

FIRST BLOOD THREATS (players who get opening kills most often):
${
  gridMetrics.topFirstBloodPlayers
    ? gridMetrics.topFirstBloodPlayers
        .map((p) => `- ${p.player}: ${p.count} first bloods`)
        .join("\n")
    : "No first blood data available"
}

TACTICAL SIGNALS:
- Side Bias: ${gridMetrics.signals.sideBias || "Balanced"}
- Strong Early Game: ${
          gridMetrics.signals.strongEarlyGame
            ? "Yes (high first blood rate)"
            : "No"
        }
- Pistol Weakness: ${
          gridMetrics.signals.weakPistols ? "Yes (below 45% win rate)" : "No"
        }
- Strong Maps: ${
          gridMetrics.signals.strongMaps.length > 0
            ? gridMetrics.signals.strongMaps.join(", ")
            : "None identified"
        }
- Weak Maps: ${
          gridMetrics.signals.weakMaps.length > 0
            ? gridMetrics.signals.weakMaps.join(", ")
            : "None identified"
        }

RECENT FORM (last 5 series):
- Wins: ${gridMetrics.recentForm.wins}
- Losses: ${gridMetrics.recentForm.losses}
- Current Streak: ${
          gridMetrics.recentForm.streak
            ? gridMetrics.recentForm.streak + " streak"
            : "Mixed results"
        }

CURRENT ROSTER:
${
  gridMetrics.players.map((p) => `- ${p.name}`).join("\n") ||
  "Roster data not available"
}

=== END GRID DATA ===

Use these REAL metrics from GRID in your analysis. These are authoritative statistics from actual matches.
Cite specific percentages and stats in your scouting report.
`;
      } else {
        systemPrompt += `
NOTE: Could not retrieve GRID.gg data for "${team}". The team may not exist in the database or there may be no recent match data.
Provide a general analysis based on your knowledge, but clearly state that real-time match data is unavailable.
`;
      }
    } else if (team) {
      systemPrompt += `
Note: The user has already received a full scouting report on "${team}". 
Provide concise, focused answers. Only provide another full report if they explicitly ask.
`;
    }

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...safeHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: message },
    ];

    // Call OpenAI
    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      }
    );

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      throw new Error(`AI API error: ${error}`);
    }

    const aiData = await aiResponse.json();
    const responseContent =
      aiData.choices?.[0]?.message?.content ||
      "I apologize, I could not generate a response.";

    // Build scouting report if this is a first team mention
    if (team && isFirstTeamMention) {
      scoutingReport = {
        teamId: gridMetrics?.teamId || team,
        teamName: gridMetrics?.teamName || team,
        logoUrl: gridMetrics?.logoUrl,
        report: responseContent,
        metrics: gridMetrics
          ? {
              agg: {
                seriesCount: gridMetrics.seriesCount,
                totalRounds: gridMetrics.totalRounds,
                attackWinRate: gridMetrics.attackWinRate,
                defenseWinRate: gridMetrics.defenseWinRate,
                firstBloodRate: gridMetrics.firstBloodRate,
                firstBloodConversion: gridMetrics.firstBloodConversion,
                pistolWinRate: gridMetrics.pistolWinRate,
                mapWinRate: gridMetrics.mapWinRate,
                mapWinRates: gridMetrics.mapWinRates,
                agentPickRates: gridMetrics.agentPickRates,
                roleDistribution: gridMetrics.roleDistribution,
              },
              signals: gridMetrics.signals,
              recentForm: gridMetrics.recentForm,
            }
          : undefined,
      };
    }

    return new Response(
      JSON.stringify({
        response: responseContent,
        scoutingReport,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in chat-with-ai:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ============= GRID API Functions =============

const GRID_URL = "https://api-op.grid.gg/central-data/graphql";

async function fetchGridTeamData(
  teamName: string,
  game: "valorant" | "league",
  apiKey: string
): Promise<TeamMetrics | null> {
  const gameSlug = game === "league" ? "league-of-legends" : "valorant";

  // Step 1: Search for the team
  const team = await searchTeam(teamName, gameSlug, apiKey);
  if (!team) {
    console.log(`Team "${teamName}" not found in GRID`);
    return null;
  }

  console.log(`Found team: ${team.name} (ID: ${team.id})`);

  // Step 2: Fetch recent series for this team
  const seriesData = await fetchTeamSeries(team.id, gameSlug, apiKey);
  if (!seriesData || seriesData.length === 0) {
    console.log(`No series data found for team ${team.name}`);
    return {
      teamId: team.id,
      teamName: team.name,
      logoUrl: team.logoUrl,
      seriesCount: 0,
      totalRounds: 0,
      avgRoundSeconds: null,
      attackWinRate: null,
      defenseWinRate: null,
      firstBloodRate: null,
      firstBloodConversion: null,
      pistolWinRate: null,
      mapWinRate: null,
      mapWinRates: {},
      agentPickRates: null,
      roleDistribution: null,
      topCompositions: null,
      topFirstBloodPlayers: null,
      signals: {
        strongMaps: [],
        weakMaps: [],
        sideBias: null,
        strongEarlyGame: false,
        weakPistols: false,
      },
      recentForm: { wins: 0, losses: 0, streak: null },
      players: team.players || [],
    };
  }

  // Step 3: Compute metrics from the series data
  const metrics = computeMetricsFromSeries(seriesData, team.id);

  return {
    teamId: team.id,
    teamName: team.name,
    logoUrl: team.logoUrl,
    ...metrics,
    players: team.players || [],
  };
}

async function searchTeam(
  teamName: string,
  gameSlug: string,
  apiKey: string
): Promise<{
  id: string;
  name: string;
  logoUrl?: string;
  players: { id: string; name: string }[];
} | null> {
  const query = `
    query SearchTeam($name: String!, $game: GameSlug!) {
      teams(where: { name: { contains: $name }, game: { slug: { equals: $game } } }, first: 1) {
        edges {
          node {
            id
            name
            logoUrl
            players {
              id
              nickname
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(GRID_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        variables: { name: teamName, game: gameSlug },
      }),
    });

    if (!response.ok) {
      console.error("GRID search failed:", await response.text());
      return null;
    }

    const data = await response.json();
    const teamNode = data?.data?.teams?.edges?.[0]?.node;

    if (!teamNode) return null;

    return {
      id: teamNode.id,
      name: teamNode.name,
      logoUrl: teamNode.logoUrl,
      players: (teamNode.players || []).map((p: any) => ({
        id: p.id,
        name: p.nickname || p.name,
      })),
    };
  } catch (error) {
    console.error("Error searching team:", error);
    return null;
  }
}

async function fetchTeamSeries(
  teamId: string,
  gameSlug: string,
  apiKey: string
): Promise<any[] | null> {
  // Fetch recent completed series for this team
  const query = `
    query TeamSeries($teamId: ID!, $game: GameSlug!) {
      series(
        where: {
          participants: { some: { team: { id: { equals: $teamId } } } }
          game: { slug: { equals: $game } }
          state: { equals: Finished }
        }
        orderBy: { startTimeScheduled: Desc }
        first: 20
      ) {
        edges {
          node {
            id
            startTimeScheduled
            teams {
              id
              name
              score
            }
            games {
              id
              map {
                name
              }
              teams {
                id
                side
                won
                score
              }
              segments {
                type
                sequenceNumber
                duration
                winningTeamId
                teams {
                  id
                  side
                  won
                  players {
                    id
                    name
                    firstKill
                    agent {
                      name
                    }
                    character {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(GRID_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        variables: { teamId, game: gameSlug },
      }),
    });

    if (!response.ok) {
      console.error("GRID series fetch failed:", await response.text());
      return null;
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GRID GraphQL errors:", JSON.stringify(data.errors));
      return null;
    }

    return data?.data?.series?.edges?.map((e: any) => e.node) || [];
  } catch (error) {
    console.error("Error fetching series:", error);
    return null;
  }
}

// ============= Metrics Computation (adapted from computeTeamMetrics.ts) =============

function agentToRole(agent: string): string {
  const a = agent.toLowerCase();

  // Duelists
  if (
    [
      "jett",
      "reyna",
      "raze",
      "phoenix",
      "yoru",
      "neon",
      "iso",
      "waylay",
    ].includes(a)
  )
    return "Duelist";

  // Controllers
  if (["omen", "brimstone", "viper", "astra", "harbor", "clove"].includes(a))
    return "Controller";

  // Initiators
  if (["sova", "skye", "breach", "kayo", "fade", "gekko", "tejo"].includes(a))
    return "Initiator";

  // Sentinels
  if (["killjoy", "cypher", "sage", "chamber", "deadlock", "vyse"].includes(a))
    return "Sentinel";

  return "Unknown";
}

function extractAgentName(player: any): string | null {
  if (!player) return null;

  const direct =
    player.agentName ?? player.agent?.name ?? player.character?.name ?? null;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  return null;
}

function parseISODuration(dur: any): number | null {
  if (typeof dur !== "string" || !dur.startsWith("PT")) return null;
  const m = dur.match(/PT(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
  if (!m) return null;

  const min = m[1] ? Number(m[1]) : 0;
  const sec = m[2] ? Number(m[2]) : 0;

  if (!Number.isFinite(min) || !Number.isFinite(sec)) return null;
  return min * 60 + sec;
}

function computeMetricsFromSeries(
  seriesData: any[],
  teamId: string
): Omit<TeamMetrics, "teamId" | "teamName" | "logoUrl" | "players"> {
  let totalRounds = 0;
  let totalRoundSeconds = 0;

  let attackRounds = 0;
  let attackWins = 0;
  let defenseRounds = 0;
  let defenseWins = 0;

  let firstBloodRounds = 0;
  let firstBloods = 0;
  let firstBloodWins = 0;

  let pistolRounds = 0;
  let pistolWins = 0;

  let mapWins = 0;
  let mapGames = 0;

  const mapWinCounts: Record<string, number> = {};
  const mapGameCounts: Record<string, number> = {};
  const agentCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};
  const compCounts: Record<string, number> = {};
  const firstBloodByPlayer: Record<string, number> = {};

  const seriesResults: boolean[] = [];

  for (const series of seriesData) {
    const games = series.games || [];

    // Determine if team won the series
    const teamScore =
      series.teams?.find((t: any) => t.id === teamId)?.score || 0;
    const oppScore =
      series.teams?.find((t: any) => t.id !== teamId)?.score || 0;
    if (teamScore > 0 || oppScore > 0) {
      seriesResults.push(teamScore > oppScore);
    }

    for (const game of games) {
      const mapName = game.map?.name || "Unknown";
      const gameTeams = game.teams || [];
      const ourGameTeam = gameTeams.find((t: any) => t.id === teamId);
      const oppGameTeam = gameTeams.find((t: any) => t.id !== teamId);

      // Map win/loss
      if (ourGameTeam?.won !== undefined) {
        mapGames++;
        mapGameCounts[mapName] = (mapGameCounts[mapName] || 0) + 1;

        if (ourGameTeam.won) {
          mapWins++;
          mapWinCounts[mapName] = (mapWinCounts[mapName] || 0) + 1;
        }
      }

      // Composition from game teams
      const ourPlayers = ourGameTeam?.players || [];
      const agents = ourPlayers
        .map((p: any) => extractAgentName(p))
        .filter((a: string | null): a is string => a !== null)
        .map((a: string) => a.toLowerCase());

      if (agents.length > 0) {
        const compKey = agents.sort().join(",");
        compCounts[compKey] = (compCounts[compKey] || 0) + 1;
      }

      // Process segments (rounds)
      const segments = game.segments || [];

      for (const seg of segments) {
        if (seg.type && String(seg.type).toLowerCase() !== "round") continue;

        totalRounds++;

        // Duration
        const seconds = parseISODuration(seg.duration);
        if (seconds !== null) totalRoundSeconds += seconds;

        // Find our team in this segment
        const segTeams = seg.teams || [];
        const ourSegTeam = segTeams.find((t: any) => t.id === teamId);
        const winningTeamId =
          seg.winningTeamId || segTeams.find((t: any) => t.won)?.id;
        const weWon = winningTeamId === teamId;

        // Side analysis
        const side = String(ourSegTeam?.side || "").toLowerCase();
        if (side.includes("attack")) {
          attackRounds++;
          if (weWon) attackWins++;
        } else if (side.includes("defen")) {
          defenseRounds++;
          if (weWon) defenseWins++;
        }

        // Pistol rounds (1 and 13)
        const seqNum = seg.sequenceNumber || 0;
        if (seqNum === 1 || seqNum === 13) {
          pistolRounds++;
          if (weWon) pistolWins++;
        }

        // First blood
        let fbTeamId: string | null = null;
        for (const t of segTeams) {
          const players = t.players || [];
          if (players.some((p: any) => p.firstKill === true)) {
            fbTeamId = t.id;
            break;
          }
        }

        if (fbTeamId) {
          firstBloodRounds++;
          if (fbTeamId === teamId) {
            firstBloods++;
            if (weWon) firstBloodWins++;

            // Track who got FB
            const fbPlayer = (ourSegTeam?.players || []).find(
              (p: any) => p.firstKill === true
            );
            if (fbPlayer?.name) {
              firstBloodByPlayer[fbPlayer.name] =
                (firstBloodByPlayer[fbPlayer.name] || 0) + 1;
            }
          }
        }

        // Agent/role counts
        for (const p of ourSegTeam?.players || []) {
          const agent = extractAgentName(p);
          if (agent) {
            agentCounts[agent] = (agentCounts[agent] || 0) + 1;
            roleCounts[agentToRole(agent)] =
              (roleCounts[agentToRole(agent)] || 0) + 1;
          }
        }
      }
    }
  }

  // Compute rates
  const agentTotal = Object.values(agentCounts).reduce((a, b) => a + b, 0);
  const roleTotal = Object.values(roleCounts).reduce((a, b) => a + b, 0);

  const agentPickRates: Record<string, number> = {};
  for (const [agent, count] of Object.entries(agentCounts)) {
    agentPickRates[agent] = agentTotal > 0 ? count / agentTotal : 0;
  }

  const roleDistribution: Record<string, number> = {};
  for (const [role, count] of Object.entries(roleCounts)) {
    roleDistribution[role] = roleTotal > 0 ? count / roleTotal : 0;
  }

  const mapWinRates: Record<string, number> = {};
  for (const map of Object.keys(mapGameCounts)) {
    mapWinRates[map] =
      mapGameCounts[map] > 0
        ? (mapWinCounts[map] || 0) / mapGameCounts[map]
        : 0;
  }

  // Top compositions
  const topCompositions = Object.entries(compCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([compKey, count]) => ({
      comp: compKey.split(",").filter(Boolean),
      count,
    }));

  // Top first blood players
  const topFirstBloodPlayers = Object.entries(firstBloodByPlayer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([player, count]) => ({ player, count }));

  // Signals
  const strongMaps = Object.entries(mapWinRates)
    .filter(([_, wr]) => wr >= 0.6)
    .map(([m]) => m);

  const weakMaps = Object.entries(mapWinRates)
    .filter(([_, wr]) => wr <= 0.4)
    .map(([m]) => m);

  const attackWinRate = attackRounds > 0 ? attackWins / attackRounds : null;
  const defenseWinRate = defenseRounds > 0 ? defenseWins / defenseRounds : null;

  let sideBias: "attack" | "defense" | null = null;
  if (
    attackWinRate !== null &&
    defenseWinRate !== null &&
    Math.abs(attackWinRate - defenseWinRate) >= 0.08
  ) {
    sideBias = attackWinRate > defenseWinRate ? "attack" : "defense";
  }

  const firstBloodRate =
    firstBloodRounds > 0 ? firstBloods / firstBloodRounds : null;
  const pistolWinRate = pistolRounds > 0 ? pistolWins / pistolRounds : null;

  // Recent form (last 5 series)
  const recentResults = seriesResults.slice(-5);
  const recentWins = recentResults.filter(Boolean).length;
  const recentLosses = recentResults.filter((r) => r === false).length;

  let recentStreak: "win" | "loss" | null = null;
  if (recentResults.length >= 3) {
    const last3 = recentResults.slice(-3);
    if (last3.every(Boolean)) recentStreak = "win";
    if (last3.every((r) => r === false)) recentStreak = "loss";
  }

  return {
    seriesCount: seriesData.length,
    totalRounds,
    avgRoundSeconds: totalRounds > 0 ? totalRoundSeconds / totalRounds : null,
    attackWinRate,
    defenseWinRate,
    firstBloodRate,
    firstBloodConversion: firstBloods > 0 ? firstBloodWins / firstBloods : null,
    pistolWinRate,
    mapWinRate: mapGames > 0 ? mapWins / mapGames : null,
    mapWinRates,
    agentPickRates:
      Object.keys(agentPickRates).length > 0 ? agentPickRates : null,
    roleDistribution:
      Object.keys(roleDistribution).length > 0 ? roleDistribution : null,
    topCompositions: topCompositions.length > 0 ? topCompositions : null,
    topFirstBloodPlayers:
      topFirstBloodPlayers.length > 0 ? topFirstBloodPlayers : null,
    signals: {
      strongMaps,
      weakMaps,
      sideBias,
      strongEarlyGame: firstBloodRate !== null && firstBloodRate >= 0.55,
      weakPistols: pistolWinRate !== null && pistolWinRate <= 0.45,
    },
    recentForm: {
      wins: recentWins,
      losses: recentLosses,
      streak: recentStreak,
    },
  };
}
