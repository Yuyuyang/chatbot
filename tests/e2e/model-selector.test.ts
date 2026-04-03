import { expect, test } from "@playwright/test";

test.describe("Model Selector access control", () => {
  test("unauthenticated users do not reach the chat shell", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login(\?.*)?$/);
    await expect(page.getByPlaceholder("Search models...")).not.toBeVisible();
  });
});
