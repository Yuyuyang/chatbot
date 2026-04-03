import { expect, test } from "@playwright/test";

test.describe("Protected API access", () => {
  test("unauthenticated chat API returns 401", async ({ request }) => {
    const response = await request.post("/api/chat", {
      data: {
        id: "test-chat",
        message: {
          id: "message-1",
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
        },
        selectedChatModel: "test-model",
        selectedVisibilityType: "private",
      },
    });

    expect(response.status()).toBe(401);

    const payload = await response.json();
    expect(payload.code).toBe("unauthorized:auth");
  });

  test("unauthenticated messages API returns 401 even for direct access", async ({
    request,
  }) => {
    const response = await request.get("/api/messages?chatId=test-chat");

    expect(response.status()).toBe(401);

    const payload = await response.json();
    expect(payload.code).toBe("unauthorized:auth");
  });
});
