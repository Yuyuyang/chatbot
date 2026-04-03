import { expect, test } from "@playwright/test";

test.describe("Protected chat pages", () => {
  test("home page redirects to login when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });

  test("chat detail page redirects to login when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/chat/test-chat-id");
    await expect(page).toHaveURL(/\/login\?redirectUrl=/);
  });
});
