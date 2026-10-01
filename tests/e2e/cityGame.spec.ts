import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { PerspectiveCamera, Vector3 } from "three";

const MAP_SIZE = 128;
const CAMERA_START = new Vector3(130, 105, 150);

test("makes the complete map available from the beginning", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  await expect(page.getByText("Auenfeld")).toBeVisible();
  await expect(page.getByText("Simulation aktiv")).toBeVisible();
  const canvas = page.locator("canvas.city-map-canvas");
  await expect(canvas).toHaveAttribute("data-renderer", "three");
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await expect
    .poll(() => countRenderedColors(page), { message: "3D canvas should not be blank" })
    .toBeGreaterThan(12);

  await selectMenuTool(page, "Stadtplanung", "Strassen");
  await clickTile(page, 80, 40);
  await expect(canvas).toHaveAttribute("data-road-count", "1");
  await expect(page.getByRole("button", { name: "Sektoren" })).toHaveCount(0);
  await expect(page.getByText("Kaufbar", { exact: true })).toHaveCount(0);

  const noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(noHorizontalOverflow).toBe(true);

  await selectMenuTool(page, "Beduerfnisse", "Uebersicht");
  const cameraBefore = await canvas.getAttribute("data-camera-position");
  await rotateCamera(page);
  await expect
    .poll(() => canvas.getAttribute("data-camera-position"))
    .not.toBe(cameraBefore);
  await expect.poll(() => countRenderedColors(page)).toBeGreaterThan(12);

  await captureScreenshot(page, testInfo);
});

test("keeps a roughly dragged road on one straight axis", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const canvas = page.locator("canvas.city-map-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await selectMenuTool(page, "Stadtplanung", "Strassen");

  const treesBefore = Number(await canvas.getAttribute("data-visible-tree-count"));
  const start = await tileScreenPosition(page, 30, 48);
  const roughTarget = await tileScreenPosition(page, 70, 52);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(roughTarget.x, roughTarget.y, { steps: 10 });
  await page.mouse.up();

  await expect(canvas).toHaveAttribute("data-road-count", "41");
  await expect(canvas).toHaveAttribute("data-road-row-count", "1");
  await expect(canvas).toHaveAttribute("data-road-column-count", "41");
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-visible-tree-count")))
    .toBeLessThan(treesBefore);
  await page.screenshot({
    path: testInfo.outputPath("straight-road-clears-trees.png"),
    fullPage: true,
  });
});

test("builds zones and complete utility services in the 3D world", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  await page.goto("/");

  const canvas = page.locator("canvas.city-map-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");

  await selectMenuTool(page, "Stadtplanung", "Strassen");
  await expect(page.getByLabel("Strassenbau")).toBeVisible();
  for (let row = 88; row <= 100; row += 1) {
    await clickTile(page, 8, row);
  }
  for (let column = 9; column <= 44; column += 1) {
    await clickTile(page, column, 100);
  }
  await expect.poll(() => canvas.getAttribute("data-road-count")).toBe("49");
  await expect(canvas).toHaveAttribute("data-outside-connected", "true");

  await selectMenuTool(page, "Gebiete", "Wohngebiet");
  await expect(page.getByRole("complementary", { name: "Wohnzone" })).toBeVisible();
  await clickTile(page, 10, 102);
  await expect.poll(() => canvas.getAttribute("data-residential-count")).toBe("9");

  await selectMenuTool(page, "Gebiete", "Gewerbegebiet");
  await expect(page.getByRole("complementary", { name: "Gewerbezone" })).toBeVisible();
  await clickTile(page, 17, 102);
  await expect.poll(() => canvas.getAttribute("data-commercial-count")).toBe("9");

  await selectMenuTool(page, "Gebiete", "Industriegebiet");
  await expect(
    page.getByRole("complementary", { name: "Industriezone" }),
  ).toBeVisible();
  await clickTile(page, 24, 102);
  await expect.poll(() => canvas.getAttribute("data-industrial-count")).toBe("9");
  await expect(canvas).toHaveAttribute("data-outside-connected-zones", "27");
  await expect(canvas).toHaveAttribute("data-outside-vehicle-count", "2");
  await expect(page.getByText("Gebaeude")).toBeVisible();

  await selectMenuTool(page, "Beduerfnisse", "Strom");
  await expect(
    page.getByRole("complementary", { name: "Stromversorgung" }),
  ).toBeVisible();
  await clickTile(page, 12, 101);
  await expect.poll(() => canvas.getAttribute("data-wind-turbine-count")).toBe("1");
  await expect(page.getByText("Windkraftanlage gebaut.")).toBeVisible();
  await expect(canvas).toHaveAttribute("data-electricity-coverage", "81");

  await page.getByRole("button", { name: /Kraftwerk/ }).click();
  await clickTile(page, 27, 101);
  await expect.poll(() => canvas.getAttribute("data-power-plant-count")).toBe("1");
  await expect(canvas).toHaveAttribute("data-electricity-capacity", "220");
  await expect(canvas).toHaveAttribute("data-electricity-demand", "54");
  await expect(page.getByLabel("Zonennachfrage")).toBeVisible();

  await selectMenuTool(page, "Beduerfnisse", "Wasser");
  await expect(canvas).toHaveAttribute("data-utility-overlay", "water");
  await expect(canvas).toHaveAttribute("data-utility-overlay-status", "shortage");
  await clickTile(page, 32, 101);
  await expect.poll(() => canvas.getAttribute("data-water-pump-count")).toBe("1");
  await expect(canvas).toHaveAttribute("data-water-capacity", "90");
  await expect(canvas).toHaveAttribute("data-water-demand", "45");
  await expect(canvas).toHaveAttribute("data-utility-overlay-status", "supplied");

  await selectMenuTool(page, "Beduerfnisse", "Abwasser");
  await expect(canvas).toHaveAttribute("data-utility-overlay", "sewage");
  await clickTile(page, 36, 101);
  await expect.poll(() => canvas.getAttribute("data-sewage-plant-count")).toBe("1");
  await expect(canvas).toHaveAttribute("data-sewage-capacity", "150");
  await expect(canvas).toHaveAttribute("data-sewage-demand", "45");

  await selectMenuTool(page, "Beduerfnisse", "Muell");
  await expect(page.getByRole("button", { name: /Recyclinghof/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Verbrennungsanlage/ })).toBeVisible();
  await clickTile(page, 41, 101);
  await expect.poll(() => canvas.getAttribute("data-landfill-count")).toBe("1");
  await expect(canvas).toHaveAttribute("data-waste-capacity", "130");
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-population")))
    .toBeGreaterThan(0);
  await expect(canvas).toHaveAttribute("data-jobs", "90");
  await page.screenshot({
    path: testInfo.outputPath("citybuilder-services.png"),
    fullPage: true,
  });

  await selectMenuTool(page, "Werkzeuge", "Bulldozer");
  await expect(page.getByRole("complementary", { name: "Bulldozer" })).toBeVisible();
  await clickTile(page, 24, 102);
  await expect.poll(() => canvas.getAttribute("data-industrial-count")).toBe("8");
  await expect(page.getByText("1 Objekt entfernt.")).toBeVisible();
  await clickTile(page, 12, 102);
  await expect.poll(() => canvas.getAttribute("data-wind-turbine-count")).toBe("0");

  await expect.poll(() => countRenderedColors(page)).toBeGreaterThan(12);
  for (let zoomStep = 0; zoomStep < 3; zoomStep += 1) {
    await page.getByRole("button", { name: "Hineinzoomen" }).click();
  }

  await page.screenshot({
    path: testInfo.outputPath("citybuilder-build.png"),
    fullPage: true,
  });
});

test("protects the regional road and detects a broken city connection", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.locator("canvas.city-map-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await expect(canvas).toHaveAttribute("data-regional-road-count", "8");
  await expect(canvas).toHaveAttribute("data-outside-connected", "false");
  await expect(
    page.getByRole("status", { name: "Aussenverbindung: Anschluss fehlt" }),
  ).toBeVisible();

  await selectMenuTool(page, "Werkzeuge", "Bulldozer");
  await clickTile(page, 3, 88);
  await expect(
    page.getByText(
      "Die regionale Hauptstrasse ist Teil der Aussenverbindung und kann nicht entfernt werden.",
    ),
  ).toBeVisible();
  await expect(canvas).toHaveAttribute("data-regional-road-count", "8");

  await selectMenuTool(page, "Stadtplanung", "Strassen");
  await clickTile(page, 8, 88);
  await expect(canvas).toHaveAttribute("data-outside-connected", "true");
  await expect(canvas).toHaveAttribute("data-outside-vehicle-count", "1");

  await selectMenuTool(page, "Werkzeuge", "Bulldozer");
  await clickTile(page, 8, 88);
  await expect(canvas).toHaveAttribute("data-outside-connected", "false");
  await expect(canvas).toHaveAttribute("data-outside-vehicle-count", "0");
});

test("organizes city tools and restores a manual savegame", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  const canvas = page.locator("canvas.city-map-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");

  await page.getByRole("tab", { name: "Oeffentliche Einrichtungen" }).click();
  await expect(
    page.getByRole("button", { name: "Polizei", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Feuerwehr", exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole("button", { name: "Rathaus - geplant" })).toBeDisabled();

  await selectMenuTool(page, "Beduerfnisse", "Uebersicht");
  await expect(page.getByRole("complementary", { name: "Beduerfnisse" })).toBeVisible();
  await expect(page.getByText("Grundversorgung", { exact: true })).toBeVisible();

  await selectMenuTool(page, "Stadtplanung", "Strassen");
  await clickTile(page, 8, 100);
  await expect.poll(() => canvas.getAttribute("data-road-count")).toBe("1");

  await page.getByRole("button", { name: "Speicherstaende" }).click();
  const saveDialog = page.getByRole("dialog", { name: "Speicherstaende" });
  await expect(saveDialog).toBeVisible();
  await saveDialog.getByLabel("Name des Spielstands").fill("Teststadt");
  await saveDialog.getByRole("button", { name: "Spielstand speichern" }).click();
  await expect(saveDialog.getByText("Teststadt", { exact: true })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("citybuilder-savegames.png"),
    fullPage: true,
  });
  await saveDialog.getByRole("button", { name: "Speicherstaende schliessen" }).click();

  await selectMenuTool(page, "Werkzeuge", "Bulldozer");
  await clickTile(page, 8, 100);
  await expect.poll(() => canvas.getAttribute("data-road-count")).toBe("0");

  await page.getByRole("button", { name: "Speicherstaende" }).click();
  await page.getByRole("button", { name: "Teststadt laden" }).click();
  await expect.poll(() => canvas.getAttribute("data-road-count")).toBe("1");
  await expect(page.getByText("Spielstand geladen.")).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Beduerfnisse" })).toBeVisible();

  await page.getByRole("button", { name: "Speicherstaende" }).click();
  await page.getByRole("button", { name: "Teststadt loeschen" }).click();
  await page.getByRole("button", { name: "Teststadt wirklich loeschen" }).click();
  await expect(page.getByText("Teststadt", { exact: true })).toHaveCount(0);
});

test("builds road-based public services and shows land values", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  await page.goto("/");

  const canvas = page.locator("canvas.city-map-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");

  await selectMenuTool(page, "Stadtplanung", "Strassen");
  for (let column = 8; column <= 44; column += 1) {
    await clickTile(page, column, 88);
  }
  await selectMenuTool(page, "Gebiete", "Wohngebiet");
  await clickTile(page, 30, 86);
  await expect.poll(() => canvas.getAttribute("data-residential-count")).toBe("9");

  await selectMenuTool(page, "Oeffentliche Einrichtungen", "Feuerwehr");
  await expect(page.getByRole("complementary", { name: "Feuerwehr" })).toBeVisible();
  await clickTile(page, 10, 90);
  await expect.poll(() => canvas.getAttribute("data-fire-station-count")).toBe("1");
  await expect(canvas).toHaveAttribute("data-fire-coverage", "100");

  await selectMenuTool(page, "Oeffentliche Einrichtungen", "Polizei");
  await clickTile(page, 14, 90);
  await expect.poll(() => canvas.getAttribute("data-police-station-count")).toBe("1");

  await selectMenuTool(page, "Oeffentliche Einrichtungen", "Gesundheit");
  await clickTile(page, 18, 90);
  await expect.poll(() => canvas.getAttribute("data-clinic-count")).toBe("1");

  await selectMenuTool(page, "Oeffentliche Einrichtungen", "Bildung");
  await clickTile(page, 22, 90);
  await expect.poll(() => canvas.getAttribute("data-school-count")).toBe("1");
  await expect(canvas).toHaveAttribute("data-education-coverage", "100");

  await selectMenuTool(page, "Gebiete", "Grundstueckswerte");
  await expect(
    page.getByRole("complementary", { name: "Grundstueckswerte" }),
  ).toBeVisible();
  await expect(canvas).toHaveAttribute("data-land-value-overlay", "true");
  await expect.poll(() => countRenderedColors(page)).toBeGreaterThan(12);
  await page.screenshot({
    path: testInfo.outputPath("citybuilder-public-services.png"),
    fullPage: true,
  });
});

test("supports trackpad pan and pinch zoom", async ({ page }) => {
  test.setTimeout(15_000);
  await page.goto("/");

  const canvas = page.locator("canvas.city-map-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");
  const before = await readCameraPose(canvas);

  await dispatchTrackpadWheel(page, canvas, {
    deltaX: 140,
    deltaY: 0,
    ctrlKey: false,
  });

  const afterPan = await readCameraPose(canvas);
  expect(afterPan.target.join(",")).not.toBe(before.target.join(","));
  expect(cameraDistance(afterPan)).toBeCloseTo(cameraDistance(before), 1);

  await dispatchTrackpadWheel(page, canvas, {
    deltaX: 0,
    deltaY: -180,
    ctrlKey: true,
  });
  const afterPinch = await readCameraPose(canvas);
  expect(cameraDistance(afterPinch)).not.toBeCloseTo(cameraDistance(afterPan), 1);
});

test("pauses traffic and builds avenues two tiles wide", async ({ page }, testInfo) => {
  await page.goto("/");

  const canvas = page.locator("canvas.city-map-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");

  await selectMenuTool(page, "Stadtplanung", "Strassen");
  await clickTile(page, 8, 88);
  await expect(canvas).toHaveAttribute("data-outside-vehicle-count", "1");
  const movingProgress = await canvas.getAttribute("data-traffic-progress");
  await expect
    .poll(() => canvas.getAttribute("data-traffic-progress"))
    .not.toBe(movingProgress);

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(canvas).toHaveAttribute("data-simulation-speed", "0");
  await page.waitForTimeout(100);
  const pausedProgress = await canvas.getAttribute("data-traffic-progress");
  await page.waitForTimeout(400);
  await expect(canvas).toHaveAttribute("data-traffic-progress", pausedProgress!);

  await selectMenuTool(page, "Stadtplanung", "Alleen");
  await expect(page.getByLabel("Alleebau")).toBeVisible();
  await clickTile(page, 10, 90);
  await expect(canvas).toHaveAttribute("data-avenue-count", "2");
  await expect(canvas).toHaveAttribute("data-road-count", "3");
  await page.screenshot({
    path: testInfo.outputPath("citybuilder-avenue.png"),
    fullPage: true,
  });
});

test("offers loans with selectable amount and term", async ({ page }, testInfo) => {
  await page.goto("/");

  const canvas = page.locator("canvas.city-map-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await selectMenuTool(page, "Werkzeuge", "Finanzen");

  const inspector = page.getByRole("complementary", { name: "Finanzen" });
  await expect(inspector).toBeVisible();
  await inspector.getByRole("button", { name: /100.?000/ }).click();
  await inspector.getByRole("button", { name: "72 Monate" }).click();
  await expect(inspector.getByText("7.1 %", { exact: true })).toBeVisible();
  await inspector.getByRole("button", { name: "Kredit aufnehmen" }).click();

  await expect(canvas).toHaveAttribute("data-active-loan-count", "1");
  await expect(canvas).toHaveAttribute("data-total-debt", "100000");
  await expect(page.getByText(/Kredit ueber CHF 100.?000 aufgenommen/)).toBeVisible();
  await expect(inspector.getByText("72 Monate verbleibend")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("citybuilder-finances.png"),
    fullPage: true,
  });
});

async function selectMenuTool(page: Page, category: string, tool: string) {
  await page.getByRole("tab", { name: category }).click();
  await page.getByRole("button", { name: tool, exact: true }).click();
}

async function clickTile(page: Page, column: number, row: number) {
  const canvas = page.locator("canvas.city-map-canvas");
  const position = await tileScreenPosition(page, column, row);
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Map canvas has no visible bounds");

  await canvas.click({
    position: {
      x: position.x - bounds.x,
      y: position.y - bounds.y,
    },
  });
}

async function tileScreenPosition(page: Page, column: number, row: number) {
  const canvas = page.locator("canvas.city-map-canvas");
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Map canvas has no visible bounds");

  const camera = new PerspectiveCamera(45, bounds.width / bounds.height, 0.5, 600);
  camera.position.copy(CAMERA_START);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  const position = new Vector3(
    -MAP_SIZE / 2 + column + 0.5,
    0.72,
    -MAP_SIZE / 2 + row + 0.5,
  ).project(camera);

  return {
    x: bounds.x + ((position.x + 1) / 2) * bounds.width,
    y: bounds.y + ((-position.y + 1) / 2) * bounds.height,
  };
}

async function countRenderedColors(page: Page): Promise<number> {
  return page.locator("canvas.city-map-canvas").evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const gl =
      canvas.getContext("webgl2", { preserveDrawingBuffer: true }) ??
      canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) return 0;

    const pixel = new Uint8Array(4);
    const colors = new Set<string>();
    for (let column = 1; column <= 9; column += 1) {
      for (let row = 1; row <= 9; row += 1) {
        const x = Math.floor((gl.drawingBufferWidth * column) / 10);
        const y = Math.floor((gl.drawingBufferHeight * row) / 10);
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        colors.add(`${pixel[0]}-${pixel[1]}-${pixel[2]}-${pixel[3]}`);
      }
    }
    return colors.size;
  });
}

async function readCameraPose(canvas: ReturnType<Page["locator"]>) {
  const position = (await canvas.getAttribute("data-camera-position"))
    ?.split(",")
    .map(Number);
  const target = (await canvas.getAttribute("data-camera-target"))
    ?.split(",")
    .map(Number);
  if (!position || !target) throw new Error("Camera diagnostics are not available");
  return { position, target };
}

async function dispatchTrackpadWheel(
  page: Page,
  canvas: ReturnType<Page["locator"]>,
  gesture: { deltaX: number; deltaY: number; ctrlKey: boolean },
) {
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Map canvas has no visible bounds");
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  if (gesture.ctrlKey) await page.keyboard.down("Control");
  await page.mouse.wheel(gesture.deltaX, gesture.deltaY);
  if (gesture.ctrlKey) await page.keyboard.up("Control");
}

function cameraDistance(pose: { position: number[]; target: number[] }): number {
  return Math.hypot(
    pose.position[0] - pose.target[0],
    pose.position[1] - pose.target[1],
    pose.position[2] - pose.target[2],
  );
}

async function rotateCamera(page: Page): Promise<void> {
  const canvas = page.locator("canvas.city-map-canvas");
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Map canvas has no visible bounds");

  const startX = bounds.x + bounds.width * 0.62;
  const startY = bounds.y + bounds.height * 0.38;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 78, startY + 26, { steps: 8 });
  await page.mouse.up();
}

async function captureScreenshot(page: Page, testInfo: TestInfo) {
  await page.screenshot({
    path: testInfo.outputPath("citybuilder.png"),
    fullPage: true,
  });
}
