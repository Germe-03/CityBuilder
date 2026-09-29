import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { PerspectiveCamera, Vector3 } from "three";

const MAP_SIZE = 128;
const SECTOR_SIZE = 16;
const CAMERA_START = new Vector3(130, 105, 150);

test("selects and purchases an adjacent sector", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByText("Auenfeld")).toBeVisible();
  await expect(page.getByText("Simulation aktiv")).toBeVisible();
  const canvas = page.locator("canvas.city-map-canvas");
  await expect(canvas).toHaveAttribute("data-renderer", "three");
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await expect
    .poll(() => countRenderedColors(page), { message: "3D canvas should not be blank" })
    .toBeGreaterThan(12);

  await selectSector(page, 1, 3);

  const inspector = page.getByLabel("Sektor B4");
  await expect(inspector).toBeVisible();
  await expect(inspector.getByText("Kaufbar", { exact: true })).toBeVisible();
  await inspector.getByRole("button", { name: "Sektor kaufen" }).click();

  const dialog = page.getByRole("dialog", { name: "Sektor B4 kaufen?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Kaufen" }).click();

  await expect(inspector.getByText("Teil der Stadt")).toBeVisible();
  await expect(page.getByText(/67.?000/).first()).toBeVisible();
  await expect(page.getByText("Sektor B4 wurde erschlossen.")).toBeVisible();

  const noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(noHorizontalOverflow).toBe(true);

  const cameraBefore = await canvas.getAttribute("data-camera-position");
  await rotateCamera(page);
  await expect
    .poll(() => canvas.getAttribute("data-camera-position"))
    .not.toBe(cameraBefore);
  await expect.poll(() => countRenderedColors(page)).toBeGreaterThan(12);

  await captureScreenshot(page, testInfo);
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
  for (let column = 8; column <= 44; column += 1) {
    await clickTile(page, column, 100);
  }
  await expect.poll(() => canvas.getAttribute("data-road-count")).toBe("37");

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
  await expect(page.getByText("Gebaeude")).toBeVisible();

  await selectMenuTool(page, "Beduerfnisse", "Strom");
  await expect(
    page.getByRole("complementary", { name: "Stromversorgung" }),
  ).toBeVisible();
  await clickTile(page, 12, 101);
  await expect.poll(() => canvas.getAttribute("data-wind-turbine-count")).toBe("1");
  await expect(page.getByText("Windkraftanlage gebaut.")).toBeVisible();

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

test("organizes city tools and restores a manual savegame", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  const canvas = page.locator("canvas.city-map-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");

  await page.getByRole("tab", { name: "Oeffentliche Einrichtungen" }).click();
  await expect(page.getByRole("button", { name: "Polizei - geplant" })).toBeDisabled();
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

async function selectSector(page: Page, column: number, row: number) {
  const canvas = page.locator("canvas.city-map-canvas");
  await expect(canvas).toBeVisible();
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Map canvas has no visible bounds");

  const camera = new PerspectiveCamera(45, bounds.width / bounds.height, 0.5, 600);
  camera.position.copy(CAMERA_START);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  const worldPosition = new Vector3(
    -MAP_SIZE / 2 + (column + 0.5) * SECTOR_SIZE,
    0.56,
    -MAP_SIZE / 2 + (row + 0.5) * SECTOR_SIZE,
  ).project(camera);

  await canvas.click({
    position: {
      x: ((worldPosition.x + 1) / 2) * bounds.width,
      y: ((-worldPosition.y + 1) / 2) * bounds.height,
    },
  });
}

async function selectMenuTool(page: Page, category: string, tool: string) {
  await page.getByRole("tab", { name: category }).click();
  await page.getByRole("button", { name: tool, exact: true }).click();
}

async function clickTile(page: Page, column: number, row: number) {
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

  await canvas.click({
    position: {
      x: ((position.x + 1) / 2) * bounds.width,
      y: ((-position.y + 1) / 2) * bounds.height,
    },
  });
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
