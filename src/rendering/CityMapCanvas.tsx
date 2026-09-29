import { Maximize2, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  BufferAttribute,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  EdgesGeometry,
  Fog,
  GridHelper,
  Group,
  HemisphereLight,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFShadowMap,
  Plane,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TOUCH,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { DemandIndicator } from "../components/DemandIndicator";
import {
  MAP_SECTORS_PER_SIDE,
  MAP_TILES_PER_SIDE,
  SERVICE_BUILDING_DEFINITIONS,
  SECTOR_TILES_PER_SIDE,
  getBuildCost,
  getElectricityCapacity,
  getElectricityDemand,
  getServiceFootprintTiles,
  getUtilityCapacity,
  getUtilityDemand,
  getSectorLabel,
  getSectorPurchaseInfo,
  placeServiceBuilding,
  type BuildKind,
  type GameState,
  type MapTile,
  type SectorStatus,
  type ServiceBuilding,
  type ServiceBuildingKind,
  type ServiceCategory,
  type ZonedTile,
  type ZoneType,
} from "../simulation/cityMap";
import type { ToolId } from "../store/gameStore";

const SECTOR_SIZE = SECTOR_TILES_PER_SIDE;
const MAP_SIZE = MAP_SECTORS_PER_SIDE * SECTOR_SIZE;
const HALF_MAP = MAP_SIZE / 2;
const CAMERA_START = new Vector3(130, 105, 150);
const CAMERA_TARGET = new Vector3(0, 0, 0);

interface CityMapCanvasProps {
  state: GameState;
  selectedSectorId: number | null;
  activeTool: ToolId;
  selectedServiceBuildingKind: ServiceBuildingKind;
  onSelectSector: (sectorId: number) => void;
  onBuildTiles: (kind: BuildKind, tiles: MapTile[]) => void;
  onDemolishTiles: (tiles: MapTile[]) => void;
  onPlaceServiceBuilding: (kind: ServiceBuildingKind, anchor: MapTile) => void;
}

interface CameraControlsApi {
  fit: () => void;
  zoomBy: (factor: number) => void;
}

interface SectorVisual {
  id: number;
  mesh: Mesh<BoxGeometry, MeshBasicMaterial>;
  border: LineSegments<EdgesGeometry, LineBasicMaterial>;
  label: Sprite;
}

interface SceneResources {
  world: Group;
  buildLayer: Group;
  utilityOverlayLayer: Group;
  visuals: SectorVisual[];
  clickTargets: Array<Mesh<BoxGeometry, MeshBasicMaterial>>;
  dispose: () => void;
}

export function CityMapCanvas({
  state,
  selectedSectorId,
  activeTool,
  selectedServiceBuildingKind,
  onSelectSector,
  onBuildTiles,
  onDemolishTiles,
  onPlaceServiceBuilding,
}: CityMapCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cameraApiRef = useRef<CameraControlsApi | null>(null);
  const visualsRef = useRef<SectorVisual[]>([]);
  const buildLayerRef = useRef<Group | null>(null);
  const utilityOverlayLayerRef = useRef<Group | null>(null);
  const latestRef = useRef({
    state,
    selectedSectorId,
    activeTool,
    selectedServiceBuildingKind,
    onSelectSector,
    onBuildTiles,
    onDemolishTiles,
    onPlaceServiceBuilding,
  });
  const hoveredSectorRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new Scene();
    scene.background = new Color(0x91aeb3);
    scene.fog = new Fog(0x91aeb3, 235, 430);

    const camera = new PerspectiveCamera(45, 1, 0.5, 600);
    camera.position.copy(CAMERA_START);
    camera.lookAt(CAMERA_TARGET);

    const renderer = new WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    renderer.domElement.className = "city-map-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.dataset.renderer = "three";
    host.prepend(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(CAMERA_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = 72;
    controls.maxDistance = 360;
    controls.minPolarAngle = 0.52;
    controls.maxPolarAngle = 1.38;
    controls.enablePan = true;
    controls.screenSpacePanning = false;
    controls.touches.ONE = TOUCH.ROTATE;
    controls.touches.TWO = TOUCH.DOLLY_PAN;
    controls.update();

    addLighting(scene);
    const resources = createWorld(scene, latestRef.current.state);
    visualsRef.current = resources.visuals;
    buildLayerRef.current = resources.buildLayer;
    utilityOverlayLayerRef.current = resources.utilityOverlayLayer;
    updateBuildVisuals(resources.buildLayer, latestRef.current.state);
    updateUtilityOverlay(
      resources.utilityOverlayLayer,
      latestRef.current.state,
      latestRef.current.activeTool,
    );
    updateSectorVisuals(
      resources.visuals,
      latestRef.current.state,
      latestRef.current.selectedSectorId,
      hoveredSectorRef.current,
      latestRef.current.activeTool,
    );

    const buildPreview = new Mesh(
      new BoxGeometry(1, 0.16, 1),
      new MeshBasicMaterial({
        color: 0x57d57a,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
      }),
    );
    buildPreview.visible = false;
    buildPreview.renderOrder = 8;
    resources.world.add(buildPreview);

    const syncCameraData = () => {
      renderer.domElement.dataset.cameraPosition = camera.position
        .toArray()
        .map((value) => value.toFixed(2))
        .join(",");
      renderer.domElement.dataset.cameraTarget = controls.target
        .toArray()
        .map((value) => value.toFixed(2))
        .join(",");
    };
    controls.addEventListener("change", syncCameraData);
    syncCameraData();

    const fit = () => {
      camera.position.copy(CAMERA_START);
      controls.target.copy(CAMERA_TARGET);
      controls.update();
      syncCameraData();
    };
    const zoomBy = (factor: number) => {
      const offset = camera.position.clone().sub(controls.target);
      const nextDistance = Math.min(
        controls.maxDistance,
        Math.max(controls.minDistance, offset.length() / factor),
      );
      offset.setLength(nextDistance);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      syncCameraData();
    };
    cameraApiRef.current = { fit, zoomBy };

    const handleTrackpadWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (event.ctrlKey) {
        zoomBy(Math.exp(-event.deltaY * 0.0025));
        return;
      }

      const distance = camera.position.distanceTo(controls.target);
      const panScale = distance * 0.00125;
      const cameraRight = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      cameraRight.y = 0;
      cameraRight.normalize();
      const cameraForward = controls.target.clone().sub(camera.position);
      cameraForward.y = 0;
      cameraForward.normalize();

      const offset = cameraRight
        .multiplyScalar(event.deltaX * panScale)
        .add(cameraForward.multiplyScalar(-event.deltaY * panScale));
      const nextTarget = controls.target.clone().add(offset);
      nextTarget.x = clamp(nextTarget.x, -HALF_MAP, HALF_MAP);
      nextTarget.z = clamp(nextTarget.z, -HALF_MAP, HALF_MAP);
      nextTarget.y = CAMERA_TARGET.y;

      camera.position.add(nextTarget.clone().sub(controls.target));
      controls.target.copy(nextTarget);
      controls.update();
      syncCameraData();
    };
    renderer.domElement.addEventListener("wheel", handleTrackpadWheel, {
      capture: true,
      passive: false,
    });

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const buildPlane = new Plane(new Vector3(0, 1, 0), -0.72);
    const buildPoint = new Vector3();
    const paintedTileKeys = new Set<string>();
    let pointerDownX = 0;
    let pointerDownY = 0;
    let painting = false;

    const setPointerFromEvent = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
    };

    const getSectorAtPointer = (event: PointerEvent): number | null => {
      setPointerFromEvent(event);
      const hit = raycaster.intersectObjects(resources.clickTargets, false)[0];
      return hit ? Number(hit.object.userData.sectorId) : null;
    };

    const getTileAtPointer = (event: PointerEvent): MapTile | null => {
      setPointerFromEvent(event);
      if (!raycaster.ray.intersectPlane(buildPlane, buildPoint)) return null;
      const column = Math.floor(buildPoint.x + HALF_MAP);
      const row = Math.floor(buildPoint.z + HALF_MAP);
      if (
        column < 0 ||
        row < 0 ||
        column >= MAP_TILES_PER_SIDE ||
        row >= MAP_TILES_PER_SIDE
      ) {
        return null;
      }
      return { column, row };
    };

    const updateBuildPreview = (tile: MapTile | null) => {
      const tool = latestRef.current.activeTool;
      const kind = getBuildKind(tool);
      if (!tile || !isPaintTool(tool)) {
        buildPreview.visible = false;
        return;
      }

      const serviceDefinition =
        getUtilityCategory(tool) !== null
          ? SERVICE_BUILDING_DEFINITIONS[latestRef.current.selectedServiceBuildingKind]
          : null;
      const size = serviceDefinition
        ? serviceDefinition.footprint - 0.1
        : !kind || kind === "road"
          ? 0.92
          : 2.9;
      buildPreview.scale.set(size, 1, size);
      buildPreview.position.set(
        -HALF_MAP + tile.column + (serviceDefinition?.footprint ?? 1) / 2,
        0.84,
        -HALF_MAP + tile.row + (serviceDefinition?.footprint ?? 1) / 2,
      );
      if (tool === "bulldozer") {
        buildPreview.material.color.setHex(
          canDemolishAt(latestRef.current.state, tile) ? 0xd94b3e : 0x7d8984,
        );
      } else if (getUtilityCategory(tool)) {
        buildPreview.material.color.setHex(
          placeServiceBuilding(
            latestRef.current.state,
            latestRef.current.selectedServiceBuildingKind,
            tile,
          ).ok
            ? getUtilityPreviewColor(getUtilityCategory(tool)!)
            : 0xe45d4c,
        );
      } else if (kind) {
        buildPreview.material.color.setHex(
          canBuildAt(latestRef.current.state, kind, tile)
            ? getBuildPreviewColor(kind)
            : 0xe45d4c,
        );
      }
      buildPreview.visible = true;
    };

    const paintAt = (tile: MapTile | null) => {
      const tool = latestRef.current.activeTool;
      const kind = getBuildKind(tool);
      if (!tile || !isPaintTool(tool)) return;
      const brushTiles = kind ? getBrushTiles(kind, tile) : [tile];
      const requestedTiles = brushTiles.filter((candidate) => {
        const key = `${candidate.column}:${candidate.row}`;
        if (paintedTileKeys.has(key)) return false;
        paintedTileKeys.add(key);
        return true;
      });
      if (requestedTiles.length > 0) {
        if (tool === "bulldozer") {
          latestRef.current.onDemolishTiles(requestedTiles);
        } else if (getUtilityCategory(tool)) {
          latestRef.current.onPlaceServiceBuilding(
            latestRef.current.selectedServiceBuildingKind,
            tile,
          );
        } else if (kind) {
          latestRef.current.onBuildTiles(kind, requestedTiles);
        }
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDownX = event.clientX;
      pointerDownY = event.clientY;
      if (!isPaintTool(latestRef.current.activeTool) || event.button !== 0) return;
      painting = true;
      paintedTileKeys.clear();
      controls.enabled = false;
      renderer.domElement.setPointerCapture(event.pointerId);
      const tile = getTileAtPointer(event);
      updateBuildPreview(tile);
      paintAt(tile);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (isPaintTool(latestRef.current.activeTool)) {
        const tile = getTileAtPointer(event);
        updateBuildPreview(tile);
        if (painting && !getUtilityCategory(latestRef.current.activeTool))
          paintAt(tile);
        renderer.domElement.style.cursor = "crosshair";
        return;
      }
      if (event.buttons !== 0) return;
      const hoveredSectorId = getSectorAtPointer(event);
      if (hoveredSectorId === hoveredSectorRef.current) return;
      hoveredSectorRef.current = hoveredSectorId;
      renderer.domElement.style.cursor = hoveredSectorId === null ? "grab" : "pointer";
      updateSectorVisuals(
        resources.visuals,
        latestRef.current.state,
        latestRef.current.selectedSectorId,
        hoveredSectorId,
        latestRef.current.activeTool,
      );
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (painting) {
        painting = false;
        controls.enabled = true;
        paintedTileKeys.clear();
        if (renderer.domElement.hasPointerCapture(event.pointerId)) {
          renderer.domElement.releasePointerCapture(event.pointerId);
        }
        return;
      }
      const distance = Math.hypot(
        event.clientX - pointerDownX,
        event.clientY - pointerDownY,
      );
      if (distance > 5) return;
      const sectorId = getSectorAtPointer(event);
      if (sectorId !== null) latestRef.current.onSelectSector(sectorId);
    };
    const handlePointerLeave = () => {
      painting = false;
      controls.enabled = true;
      buildPreview.visible = false;
      hoveredSectorRef.current = null;
      renderer.domElement.style.cursor = isPaintTool(latestRef.current.activeTool)
        ? "crosshair"
        : "grab";
      updateSectorVisuals(
        resources.visuals,
        latestRef.current.state,
        latestRef.current.selectedSectorId,
        null,
        latestRef.current.activeTool,
      );
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });
    renderer.domElement.dataset.ready = "true";
    setReady(true);

    return () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      controls.removeEventListener("change", syncCameraData);
      renderer.domElement.removeEventListener("wheel", handleTrackpadWheel, true);
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      resources.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      visualsRef.current = [];
      buildLayerRef.current = null;
      utilityOverlayLayerRef.current = null;
      cameraApiRef.current = null;
    };
  }, []);

  useEffect(() => {
    latestRef.current = {
      state,
      selectedSectorId,
      activeTool,
      selectedServiceBuildingKind,
      onSelectSector,
      onBuildTiles,
      onDemolishTiles,
      onPlaceServiceBuilding,
    };
    if (buildLayerRef.current) updateBuildVisuals(buildLayerRef.current, state);
    if (utilityOverlayLayerRef.current) {
      updateUtilityOverlay(utilityOverlayLayerRef.current, state, activeTool);
    }
    updateSectorVisuals(
      visualsRef.current,
      state,
      selectedSectorId,
      hoveredSectorRef.current,
      activeTool,
    );
    const canvas = hostRef.current?.querySelector("canvas");
    if (canvas) {
      canvas.style.cursor = isPaintTool(activeTool) ? "crosshair" : "grab";
      canvas.dataset.roadCount = state.roadTiles.length.toString();
      canvas.dataset.residentialCount = countZoneTiles(state, "residential").toString();
      canvas.dataset.commercialCount = countZoneTiles(state, "commercial").toString();
      canvas.dataset.industrialCount = countZoneTiles(state, "industrial").toString();
      canvas.dataset.windTurbineCount = state.serviceBuildings
        .filter((building) => building.kind === "wind-turbine")
        .length.toString();
      canvas.dataset.powerPlantCount = state.serviceBuildings
        .filter((building) => building.kind === "power-plant")
        .length.toString();
      canvas.dataset.waterPumpCount = state.serviceBuildings
        .filter((building) => building.kind === "water-pump")
        .length.toString();
      canvas.dataset.sewagePlantCount = state.serviceBuildings
        .filter((building) => building.kind === "sewage-plant")
        .length.toString();
      canvas.dataset.landfillCount = state.serviceBuildings
        .filter((building) => building.kind === "landfill")
        .length.toString();
      canvas.dataset.serviceBuildingCount = state.serviceBuildings.length.toString();
      canvas.dataset.electricityCapacity = getElectricityCapacity(state).toString();
      canvas.dataset.electricityDemand = getElectricityDemand(state).toString();
      canvas.dataset.waterCapacity = getUtilityCapacity(state, "water").toString();
      canvas.dataset.waterDemand = getUtilityDemand(state, "water").toString();
      canvas.dataset.sewageCapacity = getUtilityCapacity(state, "sewage").toString();
      canvas.dataset.sewageDemand = getUtilityDemand(state, "sewage").toString();
      canvas.dataset.wasteCapacity = getUtilityCapacity(state, "waste").toString();
      canvas.dataset.wasteDemand = getUtilityDemand(state, "waste").toString();
      canvas.dataset.population = state.population.toString();
      canvas.dataset.jobs = state.jobs.toString();
      const utilityOverlay = getUtilityCategory(activeTool);
      canvas.dataset.utilityOverlay = utilityOverlay ?? "none";
      canvas.dataset.utilityOverlayStatus = utilityOverlay
        ? getUtilityCapacity(state, utilityOverlay) >=
          getUtilityDemand(state, utilityOverlay)
          ? "supplied"
          : "shortage"
        : "none";
    }
  }, [
    activeTool,
    onBuildTiles,
    onDemolishTiles,
    onPlaceServiceBuilding,
    onSelectSector,
    selectedSectorId,
    selectedServiceBuildingKind,
    state,
  ]);

  return (
    <div
      className="map-viewport"
      ref={hostRef}
      role="img"
      aria-label="Perspektivische 3D-Stadtkarte mit 64 Sektoren"
    >
      <DemandIndicator state={state} />
      <div className="map-legend" aria-label="Kartenlegende">
        <span>
          <i className="legend-swatch legend-owned" />
          Eigenes Gebiet
        </span>
        <span>
          <i className="legend-swatch legend-available" />
          Kaufbar
        </span>
        <span>
          <i className="legend-swatch legend-locked" />
          Gesperrt
        </span>
      </div>

      <div className="camera-controls" aria-label="3D-Kamera">
        <button
          type="button"
          className="icon-button"
          onClick={() => cameraApiRef.current?.zoomBy(1.18)}
          disabled={!ready}
          aria-label="Hineinzoomen"
          title="Hineinzoomen"
        >
          <Plus aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => cameraApiRef.current?.zoomBy(0.84)}
          disabled={!ready}
          aria-label="Herauszoomen"
          title="Herauszoomen"
        >
          <Minus aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => cameraApiRef.current?.fit()}
          disabled={!ready}
          aria-label="3D-Ansicht zuruecksetzen"
          title="3D-Ansicht zuruecksetzen"
        >
          <Maximize2 aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function addLighting(scene: Scene): void {
  scene.add(new HemisphereLight(0xd7edf1, 0x28402d, 2.25));

  const sun = new DirectionalLight(0xfff2d2, 3.6);
  sun.position.set(-58, 92, 44);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -95;
  sun.shadow.camera.right = 95;
  sun.shadow.camera.top = 95;
  sun.shadow.camera.bottom = -95;
  sun.shadow.camera.near = 8;
  sun.shadow.camera.far = 230;
  sun.shadow.bias = -0.0003;
  scene.add(sun);
}

function createWorld(scene: Scene, state: GameState): SceneResources {
  const world = new Group();
  world.name = "city-world";
  scene.add(world);

  const base = new Mesh(
    new BoxGeometry(MAP_SIZE + 5, 3.2, MAP_SIZE + 5),
    new MeshStandardMaterial({ color: 0x3d6042, roughness: 1 }),
  );
  base.position.y = -1.72;
  base.receiveShadow = true;
  world.add(base);

  const terrain = new Mesh(
    createTerrainGeometry(),
    new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.98,
      metalness: 0,
      flatShading: true,
    }),
  );
  terrain.receiveShadow = true;
  world.add(terrain);

  const grid = new GridHelper(MAP_SIZE, MAP_SIZE, 0x365f46, 0x466f50);
  grid.position.y = 0.62;
  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  for (const material of gridMaterials) {
    material.transparent = true;
    material.opacity = 0.2;
    material.depthWrite = false;
  }
  world.add(grid);

  const visuals: SectorVisual[] = [];
  const clickTargets: Array<Mesh<BoxGeometry, MeshBasicMaterial>> = [];
  for (const sector of state.sectors) {
    const x = -HALF_MAP + (sector.column + 0.5) * SECTOR_SIZE;
    const z = -HALF_MAP + (sector.row + 0.5) * SECTOR_SIZE;
    const geometry = new BoxGeometry(SECTOR_SIZE - 0.45, 0.22, SECTOR_SIZE - 0.45);
    const material = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, 0.56, z);
    mesh.renderOrder = 2;
    mesh.userData.sectorId = sector.id;
    world.add(mesh);
    clickTargets.push(mesh);

    const border = new LineSegments(
      new EdgesGeometry(geometry),
      new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }),
    );
    border.position.copy(mesh.position);
    border.renderOrder = 3;
    world.add(border);

    const labelMaterial = new SpriteMaterial({
      map: createLabelTexture(getSectorLabel(sector)),
      color: 0xffffff,
      transparent: true,
      depthTest: false,
    });
    const label = new Sprite(labelMaterial);
    label.position.set(x - 5.25, 2.5, z - 5.25);
    label.scale.set(3.6, 1.8, 1);
    label.renderOrder = 5;
    world.add(label);

    visuals.push({ id: sector.id, mesh, border, label });
  }

  addTrees(world, state);

  const buildLayer = new Group();
  buildLayer.name = "city-buildings";
  world.add(buildLayer);

  const utilityOverlayLayer = new Group();
  utilityOverlayLayer.name = "utility-overlay";
  world.add(utilityOverlayLayer);

  return {
    world,
    buildLayer,
    utilityOverlayLayer,
    visuals,
    clickTargets,
    dispose: () => {
      scene.remove(world);
      disposeObject(world);
    },
  };
}

function createTerrainGeometry(): PlaneGeometry {
  const geometry = new PlaneGeometry(MAP_SIZE, MAP_SIZE, 64, 64);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  const colors: number[] = [];
  const low = new Color(0x6e9c62);
  const high = new Color(0x91b77a);

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getZ(index);
    const height = terrainHeight(x, z);
    positions.setY(index, height);
    const shade = clamp(0.35 + height * 0.85 + noise01(x, z) * 0.18, 0, 1);
    const color = low.clone().lerp(high, shade);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));
  geometry.computeVertexNormals();
  return geometry;
}

function addTrees(world: Group, state: GameState): void {
  const treePositions: Array<{ x: number; y: number; z: number; scale: number }> = [];
  for (let x = -HALF_MAP + 2; x < HALF_MAP - 2; x += 3.6) {
    for (let z = -HALF_MAP + 2; z < HALF_MAP - 2; z += 3.6) {
      const jitterX = (noise01(x * 1.8, z) - 0.5) * 1.6;
      const jitterZ = (noise01(z * 1.4, x) - 0.5) * 1.6;
      const worldX = x + jitterX;
      const worldZ = z + jitterZ;
      const column = Math.floor((worldX + HALF_MAP) / SECTOR_SIZE);
      const row = Math.floor((worldZ + HALF_MAP) / SECTOR_SIZE);
      const sector = state.sectors[row * MAP_SECTORS_PER_SIDE + column];
      if (!sector || sector.owned || noise01(x, z) < 0.57) continue;
      treePositions.push({
        x: worldX,
        y: terrainHeight(worldX, worldZ),
        z: worldZ,
        scale: 0.78 + noise01(z * 2, x * 2) * 0.52,
      });
    }
  }

  const trunk = new InstancedMesh(
    new CylinderGeometry(0.19, 0.27, 1.25, 6),
    new MeshStandardMaterial({ color: 0x69503b, roughness: 1, flatShading: true }),
    treePositions.length,
  );
  const crown = new InstancedMesh(
    new ConeGeometry(0.82, 2.55, 7),
    new MeshStandardMaterial({ color: 0x285d3b, roughness: 1, flatShading: true }),
    treePositions.length,
  );
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  crown.castShadow = true;

  const matrix = new Matrix4();
  const helper = new Object3D();
  treePositions.forEach((tree, index) => {
    helper.position.set(tree.x, tree.y + 0.62 * tree.scale, tree.z);
    helper.scale.setScalar(tree.scale);
    helper.rotation.y = noise01(tree.x * 3, tree.z * 3) * Math.PI;
    helper.updateMatrix();
    matrix.copy(helper.matrix);
    trunk.setMatrixAt(index, matrix);

    helper.position.y = tree.y + 2.15 * tree.scale;
    helper.updateMatrix();
    matrix.copy(helper.matrix);
    crown.setMatrixAt(index, matrix);
  });
  trunk.instanceMatrix.needsUpdate = true;
  crown.instanceMatrix.needsUpdate = true;
  world.add(trunk, crown);
}

function updateBuildVisuals(layer: Group, state: GameState): void {
  for (const child of [...layer.children]) {
    layer.remove(child);
    disposeObject(child);
  }

  const helper = new Object3D();

  if (state.roadTiles.length > 0) {
    const roads = new InstancedMesh(
      new BoxGeometry(0.94, 0.16, 0.94),
      new MeshStandardMaterial({ color: 0x39413f, roughness: 0.9 }),
      state.roadTiles.length,
    );
    roads.castShadow = true;
    roads.receiveShadow = true;
    state.roadTiles.forEach((tile, index) => {
      const position = tileWorldPosition(tile);
      helper.position.set(
        position.x,
        terrainHeight(position.x, position.z) + 0.12,
        position.z,
      );
      helper.rotation.set(0, 0, 0);
      helper.scale.set(1, 1, 1);
      helper.updateMatrix();
      roads.setMatrixAt(index, helper.matrix);
    });
    roads.instanceMatrix.needsUpdate = true;
    layer.add(roads);
  }

  const zoneStyles: Record<ZoneType, { ground: number }> = {
    residential: { ground: 0x4f9d68 },
    commercial: { ground: 0x4385a3 },
    industrial: { ground: 0xb17a35 },
  };

  for (const zone of ["residential", "commercial", "industrial"] as const) {
    const tiles = state.zoneTiles.filter((tile) => tile.zone === zone);
    if (tiles.length === 0) continue;

    const zoneGround = new InstancedMesh(
      new BoxGeometry(0.92, 0.08, 0.92),
      new MeshStandardMaterial({ color: zoneStyles[zone].ground, roughness: 1 }),
      tiles.length,
    );
    zoneGround.receiveShadow = true;

    tiles.forEach((tile, index) => {
      const position = tileWorldPosition(tile);
      const height = terrainHeight(position.x, position.z);
      helper.position.set(position.x, height + 0.08, position.z);
      helper.rotation.set(0, 0, 0);
      helper.scale.set(1, 1, 1);
      helper.updateMatrix();
      zoneGround.setMatrixAt(index, helper.matrix);
      addZoneBuilding(layer, tile, index);
    });
    zoneGround.instanceMatrix.needsUpdate = true;
    layer.add(zoneGround);
  }

  state.serviceBuildings.forEach((building) => addServiceBuilding(layer, building));
}

function updateUtilityOverlay(layer: Group, state: GameState, tool: ToolId): void {
  for (const child of [...layer.children]) {
    layer.remove(child);
    disposeObject(child);
  }

  const category = getUtilityCategory(tool);
  if (!category || state.zoneTiles.length === 0) return;

  const supplied =
    getUtilityCapacity(state, category) >= getUtilityDemand(state, category);
  const overlay = new InstancedMesh(
    new BoxGeometry(0.96, 0.12, 0.96),
    new MeshBasicMaterial({
      color: supplied ? 0x56d17b : 0xe05b4f,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    }),
    state.zoneTiles.length,
  );
  overlay.renderOrder = 7;

  const helper = new Object3D();
  state.zoneTiles.forEach((tile, index) => {
    const position = tileWorldPosition(tile);
    helper.position.set(
      position.x,
      terrainHeight(position.x, position.z) + 0.24,
      position.z,
    );
    helper.updateMatrix();
    overlay.setMatrixAt(index, helper.matrix);
  });
  overlay.instanceMatrix.needsUpdate = true;
  layer.add(overlay);
}

function addServiceBuilding(layer: Group, building: ServiceBuilding): void {
  const definition = SERVICE_BUILDING_DEFINITIONS[building.kind];
  const x = -HALF_MAP + building.column + definition.footprint / 2;
  const z = -HALF_MAP + building.row + definition.footprint / 2;
  const ground = terrainHeight(x, z);

  if (building.kind === "wind-turbine") {
    const base = new Mesh(
      new CylinderGeometry(0.55, 0.7, 0.28, 12),
      new MeshStandardMaterial({ color: 0xbfc8c5, roughness: 0.88 }),
    );
    base.position.set(x, ground + 0.18, z);
    base.receiveShadow = true;

    const mast = new Mesh(
      new CylinderGeometry(0.1, 0.22, 4.2, 12),
      new MeshStandardMaterial({ color: 0xe7ece9, roughness: 0.58 }),
    );
    mast.position.set(x, ground + 2.35, z);
    mast.castShadow = true;

    const nacelle = new Mesh(
      new BoxGeometry(0.62, 0.28, 0.34),
      new MeshStandardMaterial({ color: 0xf2f5f2, roughness: 0.52 }),
    );
    nacelle.position.set(x, ground + 4.48, z);
    nacelle.castShadow = true;

    const rotor = new Group();
    rotor.position.set(x, ground + 4.48, z + 0.22);
    rotor.rotation.z = noise01(building.column, building.row) * Math.PI;
    for (let index = 0; index < 3; index += 1) {
      const arm = new Group();
      arm.rotation.z = (index * Math.PI * 2) / 3;
      const blade = new Mesh(
        new BoxGeometry(0.14, 1.55, 0.09),
        new MeshStandardMaterial({ color: 0xf7faf8, roughness: 0.5 }),
      );
      blade.position.y = 0.75;
      blade.castShadow = true;
      arm.add(blade);
      rotor.add(arm);
    }

    const hub = new Mesh(
      new CylinderGeometry(0.2, 0.2, 0.28, 12),
      new MeshStandardMaterial({ color: 0xd7dfdc, roughness: 0.5 }),
    );
    hub.rotation.x = Math.PI / 2;
    rotor.add(hub);
    layer.add(base, mast, nacelle, rotor);
    return;
  }

  if (building.kind === "power-plant") {
    const body = new Mesh(
      new BoxGeometry(3.5, 1.45, 3.5),
      new MeshStandardMaterial({ color: 0x68736f, roughness: 0.86 }),
    );
    body.position.set(x, ground + 0.82, z);
    body.castShadow = true;
    body.receiveShadow = true;

    const roof = new Mesh(
      new BoxGeometry(3.7, 0.24, 3.7),
      new MeshStandardMaterial({ color: 0x424d49, roughness: 0.8 }),
    );
    roof.position.set(x, ground + 1.66, z);
    roof.castShadow = true;

    const accent = new Mesh(
      new BoxGeometry(2.2, 0.65, 0.18),
      new MeshStandardMaterial({ color: 0xd9a93d, roughness: 0.72 }),
    );
    accent.position.set(x, ground + 0.95, z + 1.84);

    const chimneyMaterial = new MeshStandardMaterial({
      color: 0xaeb7b3,
      roughness: 0.85,
    });
    for (const offset of [-0.9, 0.9]) {
      const chimney = new Mesh(
        new CylinderGeometry(0.22, 0.3, 2.6, 10),
        chimneyMaterial.clone(),
      );
      chimney.position.set(x + offset, ground + 2.85, z - 0.65);
      chimney.castShadow = true;
      layer.add(chimney);
    }
    layer.add(body, roof, accent);
    return;
  }

  if (building.kind === "water-pump") {
    const buildingBody = createServiceBox(2.45, 0.85, 2.25, 0x477f96);
    buildingBody.position.set(x, ground + 0.52, z);
    const pipe = new Mesh(
      new CylinderGeometry(0.22, 0.22, 2.5, 12),
      new MeshStandardMaterial({ color: 0x91c8d8, roughness: 0.55 }),
    );
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(x, ground + 0.95, z + 0.75);
    pipe.castShadow = true;
    layer.add(buildingBody, pipe);
    return;
  }

  if (building.kind === "water-tower") {
    const stem = new Mesh(
      new CylinderGeometry(0.22, 0.34, 2.5, 10),
      new MeshStandardMaterial({ color: 0xc7d2cf, roughness: 0.72 }),
    );
    stem.position.set(x, ground + 1.35, z);
    stem.castShadow = true;
    const tank = new Mesh(
      new CylinderGeometry(0.85, 0.65, 1.15, 14),
      new MeshStandardMaterial({ color: 0x5c9eb6, roughness: 0.58 }),
    );
    tank.position.set(x, ground + 3.0, z);
    tank.castShadow = true;
    layer.add(stem, tank);
    return;
  }

  if (building.kind === "sewage-plant") {
    const base = createServiceBox(3.55, 0.22, 3.55, 0x49675e);
    base.position.set(x, ground + 0.16, z);
    layer.add(base);
    for (const [offsetX, offsetZ] of [
      [-0.95, -0.75],
      [0.95, -0.75],
      [0, 0.95],
    ] as const) {
      const basin = new Mesh(
        new CylinderGeometry(0.72, 0.72, 0.42, 18),
        new MeshStandardMaterial({ color: 0x4f9183, roughness: 0.74 }),
      );
      basin.position.set(x + offsetX, ground + 0.44, z + offsetZ);
      basin.castShadow = true;
      layer.add(basin);
    }
    return;
  }

  if (building.kind === "landfill") {
    const base = createServiceBox(3.55, 0.18, 3.55, 0x756b55);
    base.position.set(x, ground + 0.14, z);
    layer.add(base);
    for (const offset of [-1, 0, 1]) {
      const mound = new Mesh(
        new ConeGeometry(0.72, 0.7 + Math.abs(offset) * 0.15, 7),
        new MeshStandardMaterial({ color: 0x82764e, roughness: 1 }),
      );
      mound.position.set(x + offset, ground + 0.55, z + offset * 0.35);
      mound.castShadow = true;
      layer.add(mound);
    }
    return;
  }

  if (building.kind === "recycling-center") {
    const hall = createServiceBox(2.55, 1.05, 2.4, 0x477567);
    hall.position.set(x, ground + 0.62, z);
    layer.add(hall);
    [0x4e9ac2, 0x6ea95b, 0xd5a64a].forEach((color, index) => {
      const bin = createServiceBox(0.5, 0.55, 0.65, color);
      bin.position.set(x - 0.65 + index * 0.65, ground + 0.36, z + 1.28);
      layer.add(bin);
    });
    return;
  }

  const incinerator = createServiceBox(3.5, 1.4, 3.5, 0x626965);
  incinerator.position.set(x, ground + 0.8, z);
  const chimney = new Mesh(
    new CylinderGeometry(0.28, 0.38, 3.4, 12),
    new MeshStandardMaterial({ color: 0x8c8177, roughness: 0.85 }),
  );
  chimney.position.set(x + 0.95, ground + 2.6, z - 0.75);
  chimney.castShadow = true;
  const stripe = new Mesh(
    new CylinderGeometry(0.3, 0.3, 0.34, 12),
    new MeshStandardMaterial({ color: 0xd17a42, roughness: 0.72 }),
  );
  stripe.position.set(x + 0.95, ground + 3.35, z - 0.75);
  layer.add(incinerator, chimney, stripe);
}

function createServiceBox(width: number, height: number, depth: number, color: number) {
  const mesh = new Mesh(
    new BoxGeometry(width, height, depth),
    new MeshStandardMaterial({ color, roughness: 0.82 }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addZoneBuilding(layer: Group, tile: ZonedTile, index: number): void {
  const position = tileWorldPosition(tile);
  const ground = terrainHeight(position.x, position.z);

  if (tile.zone === "residential") {
    const buildingHeight = 0.42 + noise01(tile.column, tile.row) * 0.28;
    const body = new Mesh(
      new BoxGeometry(0.5, buildingHeight, 0.5),
      new MeshStandardMaterial({
        color: index % 2 === 0 ? 0xf1dfc5 : 0xdce7df,
        roughness: 0.92,
      }),
    );
    body.position.set(position.x, ground + 0.1 + buildingHeight / 2, position.z);
    body.castShadow = true;
    body.receiveShadow = true;

    const roof = new Mesh(
      new ConeGeometry(0.43, 0.3, 4),
      new MeshStandardMaterial({ color: 0x8b4f42, roughness: 1 }),
    );
    roof.position.set(position.x, ground + 0.25 + buildingHeight, position.z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    layer.add(body, roof);
    return;
  }

  if (tile.zone === "commercial") {
    const buildingHeight = 0.9 + noise01(tile.row * 2, tile.column) * 1.25;
    const body = new Mesh(
      new BoxGeometry(0.58, buildingHeight, 0.58),
      new MeshStandardMaterial({
        color: index % 2 === 0 ? 0x83b7c7 : 0x6997aa,
        metalness: 0.18,
        roughness: 0.42,
      }),
    );
    body.position.set(position.x, ground + 0.1 + buildingHeight / 2, position.z);
    body.castShadow = true;
    body.receiveShadow = true;

    const rooftop = new Mesh(
      new BoxGeometry(0.23, 0.16, 0.23),
      new MeshStandardMaterial({ color: 0xd5e3e6, roughness: 0.7 }),
    );
    rooftop.position.set(position.x, ground + 0.18 + buildingHeight, position.z);
    rooftop.castShadow = true;
    layer.add(body, rooftop);
    return;
  }

  const body = new Mesh(
    new BoxGeometry(0.72, 0.52, 0.68),
    new MeshStandardMaterial({
      color: index % 2 === 0 ? 0x747b72 : 0x8d806f,
      roughness: 0.9,
    }),
  );
  body.position.set(position.x, ground + 0.36, position.z);
  body.castShadow = true;
  body.receiveShadow = true;

  const chimney = new Mesh(
    new CylinderGeometry(0.07, 0.09, 0.65, 8),
    new MeshStandardMaterial({ color: 0x555957, roughness: 1 }),
  );
  chimney.position.set(position.x + 0.2, ground + 0.92, position.z + 0.17);
  chimney.castShadow = true;
  layer.add(body, chimney);
}

function getBuildKind(tool: ToolId): BuildKind | null {
  if (tool === "roads") return "road";
  if (tool === "residential" || tool === "commercial" || tool === "industrial") {
    return tool;
  }
  return null;
}

function isPaintTool(tool: ToolId): boolean {
  return (
    tool === "bulldozer" ||
    getUtilityCategory(tool) !== null ||
    getBuildKind(tool) !== null
  );
}

function getUtilityCategory(tool: ToolId): ServiceCategory | null {
  if (
    tool === "electricity" ||
    tool === "water" ||
    tool === "sewage" ||
    tool === "waste"
  ) {
    return tool;
  }
  return null;
}

function getUtilityPreviewColor(category: ServiceCategory): number {
  if (category === "electricity") return 0xe6b84a;
  if (category === "water") return 0x4d9fc1;
  if (category === "sewage") return 0x4e8f7a;
  return 0x8d8170;
}

function getBrushTiles(kind: BuildKind, center: MapTile): MapTile[] {
  if (kind === "road") return [center];

  const tiles: MapTile[] = [];
  for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      const tile = {
        column: center.column + columnOffset,
        row: center.row + rowOffset,
      };
      if (
        tile.column >= 0 &&
        tile.row >= 0 &&
        tile.column < MAP_TILES_PER_SIDE &&
        tile.row < MAP_TILES_PER_SIDE
      ) {
        tiles.push(tile);
      }
    }
  }
  return tiles;
}

function canBuildAt(state: GameState, kind: BuildKind, tile: MapTile): boolean {
  const sectorColumn = Math.floor(tile.column / SECTOR_TILES_PER_SIDE);
  const sectorRow = Math.floor(tile.row / SECTOR_TILES_PER_SIDE);
  const sector = state.sectors[sectorRow * MAP_SECTORS_PER_SIDE + sectorColumn];
  if (!sector?.owned) return false;

  const key = tileKey(tile);
  if (
    state.roadTiles.some((candidate) => tileKey(candidate) === key) ||
    state.zoneTiles.some((candidate) => tileKey(candidate) === key)
  ) {
    return false;
  }

  if (state.budget < getBuildCost(kind)) return false;
  if (kind === "road") return true;

  return state.roadTiles.some(
    (road) => Math.abs(road.column - tile.column) + Math.abs(road.row - tile.row) <= 3,
  );
}

function canDemolishAt(state: GameState, tile: MapTile): boolean {
  const key = tileKey(tile);
  return (
    state.roadTiles.some((candidate) => tileKey(candidate) === key) ||
    state.zoneTiles.some((candidate) => tileKey(candidate) === key) ||
    state.serviceBuildings.some((building) =>
      getServiceFootprintTiles(building.kind, building).some(
        (candidate) => tileKey(candidate) === key,
      ),
    )
  );
}

function tileWorldPosition(tile: MapTile): { x: number; z: number } {
  return {
    x: -HALF_MAP + tile.column + 0.5,
    z: -HALF_MAP + tile.row + 0.5,
  };
}

function tileKey(tile: MapTile): string {
  return `${tile.column}:${tile.row}`;
}

function countZoneTiles(state: GameState, zone: ZoneType): number {
  return state.zoneTiles.filter((tile) => tile.zone === zone).length;
}

function getBuildPreviewColor(kind: BuildKind): number {
  if (kind === "road") return 0x555f5c;
  if (kind === "residential") return 0x57c477;
  if (kind === "commercial") return 0x4ea2c7;
  return 0xd2923e;
}

function updateSectorVisuals(
  visuals: SectorVisual[],
  state: GameState,
  selectedSectorId: number | null,
  hoveredSectorId: number | null,
  activeTool: ToolId,
): void {
  const buildMode = isPaintTool(activeTool);
  for (const visual of visuals) {
    const purchaseInfo = getSectorPurchaseInfo(state, visual.id);
    const selected = visual.id === selectedSectorId;
    const hovered = visual.id === hoveredSectorId;
    const style = sectorStyle(purchaseInfo.status);

    visual.mesh.material.color.setHex(style.fill);
    visual.mesh.material.opacity =
      buildMode && purchaseInfo.status === "owned"
        ? 0.025
        : selected
          ? Math.min(style.opacity + 0.2, 0.72)
          : hovered
            ? Math.min(style.opacity + 0.1, 0.62)
            : style.opacity;
    visual.mesh.position.y = selected ? 0.78 : hovered ? 0.67 : 0.56;

    visual.border.material.color.setHex(
      selected ? 0xffffff : hovered ? 0xe9f5ee : style.line,
    );
    visual.border.material.opacity = selected ? 1 : hovered ? 0.95 : 0.78;
    visual.border.position.y = visual.mesh.position.y;

    visual.label.material.color.setHex(selected ? 0xffffff : style.label);
    visual.label.material.opacity = purchaseInfo.status === "locked" ? 0.62 : 0.92;
    visual.label.position.y = selected ? 3 : 2.5;
    visual.label.visible = !buildMode;
  }
}

function sectorStyle(status: SectorStatus) {
  if (status === "owned") {
    return { fill: 0x63ad7b, line: 0xa4e9b7, label: 0xeaffef, opacity: 0.14 };
  }
  if (status === "available") {
    return { fill: 0xd99a2e, line: 0xffc04f, label: 0xffdfa0, opacity: 0.3 };
  }
  return { fill: 0x203a34, line: 0x627c75, label: 0xc0d0c9, opacity: 0.48 };
}

function createLabelTexture(text: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) return new CanvasTexture(canvas);

  context.fillStyle = "rgba(18, 31, 26, 0.76)";
  context.beginPath();
  context.roundRect(8, 8, 176, 80, 15);
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.42)";
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = "#ffffff";
  context.font = "700 46px Segoe UI, Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 96, 50);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function terrainHeight(x: number, z: number): number {
  const broad = Math.sin(x * 0.075) * Math.cos(z * 0.068) * 0.14;
  const detail = Math.sin((x + z) * 0.16) * 0.07;
  return 0.2 + broad + detail;
}

function noise01(x: number, z: number): number {
  const value = Math.sin(x * 12.9898 + z * 78.233) * 43_758.5453;
  return value - Math.floor(value);
}

function disposeObject(root: Object3D): void {
  root.traverse((object) => {
    const renderable = object as Mesh & {
      geometry?: { dispose: () => void };
      material?:
        MeshBasicMaterial | MeshStandardMaterial | SpriteMaterial | LineBasicMaterial;
    };
    renderable.geometry?.dispose();
    if (!renderable.material) return;
    if ("map" in renderable.material) renderable.material.map?.dispose();
    renderable.material.dispose();
  });
  root.clear();
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
