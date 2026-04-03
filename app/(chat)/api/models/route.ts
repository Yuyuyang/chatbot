import {
  chatModels,
  DEFAULT_CHAT_MODEL,
  getCapabilities,
} from "@/lib/ai/models";

export async function GET() {
  const headers = {
    "Cache-Control": "public, max-age=86400, s-maxage=86400",
  };

  return Response.json(
    {
      capabilities: getCapabilities(),
      defaultModelId: DEFAULT_CHAT_MODEL,
      models: chatModels,
    },
    { headers }
  );
}
