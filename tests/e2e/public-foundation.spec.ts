import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("les routes protégées renvoient vers la connexion", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Fdashboard$/);
  await expect(
    page.getByRole("heading", { name: "Connectez-vous à votre espace" }),
  ).toBeVisible();

  await page.goto("/agency/new");

  await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Fagency%2Fnew$/);
});

test("la connexion reste utilisable au clavier", async ({ page }) => {
  await page.goto("/auth/sign-in");

  const email = page.getByLabel("Adresse email");
  const password = page.getByLabel("Mot de passe", { exact: true });
  const submit = page.getByRole("button", { name: "Se connecter" });

  await email.focus();
  await page.keyboard.press("Tab");
  await expect(password).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
});

test("la connexion mobile ne déborde pas horizontalement", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/auth/sign-in");

  await expect(
    page.getByRole("heading", { name: "Connectez-vous à votre espace" }),
  ).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
    panelTop:
      document.querySelector(".auth-panel")?.getBoundingClientRect().top ??
      9999,
  }));

  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.panelTop).toBeLessThan(300);
});

test("le design system respecte les règles WCAG automatisables", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/design-system");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});

test("les réponses exposent les en-têtes de sécurité", async ({ request }) => {
  const response = await request.get("/auth/sign-in");

  expect(response.ok()).toBe(true);
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(response.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
});
