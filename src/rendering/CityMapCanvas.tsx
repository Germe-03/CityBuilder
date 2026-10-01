import { Maximize2, Minus, Plus, Route, Unplug } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  BufferAttribute,
  CanvasTexture,
  Clock,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  GridHelper,
  Group,
  HemisphereLight,
  InstancedMesh,
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
  MAP_TILES_PER_SIDE,
  REGIONAL_ROAD_CONNECTION_TILE,
  REGIONAL_ROAD_ENTRY_TILE,
  REGIONAL_ROAD_TILES,
  SERVICE_BUILDING_DEFINITIONS,
  getBuildCost,
  getCivicCoverage,
  getDebtSummary,
  getDominantCardinalAxis,
  getElectricityCapacity,
  getElectricityDemand,
  getOutsideConnectionSummary,
  getOutsideRoadRoute,
  getServiceFootprintTiles,
  getStraightLineTiles,
  getUtilityCapacity,
  getUtilityCoverage,
  getUtilityDemand,
  getZoneDevelopments,
  isRegionalRoadTile,
  placeServiceBuilding,
  type BuildKind,
  type CardinalAxis,
  type CivicServiceCategory,
  type GameState,
  type MapTile,
  type ServiceBuilding,
  type ServiceBuildingKind,
  type ServiceCategory,
  type ZonedTile,
  type ZoneDevelopment,
  type ZoneType,
} from "../simulation/cityMap";
import type { ToolId } from "../store/gameStore";

const MAP_SIZE = MAP_TILES_PER_SIDE;
const HALF_MAP = MAP_SIZE / 2;
const CAMERA_START = new Vector3(130, 105, 150);
const CAMERA_TARGET = new Vector3(0, 0, 0);

interface CityMapCanvasProps {
  state: GameState;
  activeTool: ToolId;
  selectedServiceBuildingKind: ServiceBuildingKind;
  onBuildTiles: (kind: BuildKind, tiles: MapTile[]) => void;
  onDemolishTiles: (tiles: MapTile[]) => void;
  onPlaceServiceBuilding: (kind: ServiceBuildingKind, anchor: MapTile) => void;
}

interface CameraControlsApi {
  fit: () => void;
  zoomBy: (factor: number) => void;
}

interface SceneResources {
  world: Group;
  buildLayer: Group;
  trafficLayer: Group;
  utilityOverlayLayer: Group;
  trees: TreeVisuals;
  dispose: () => void;
}

interface TreePosition {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
}

interface TreeVisuals {
  positions: TreePosition[];
  trunk: InstancedMesh;
  crown: InstancedMesh;
  visibleCount: number;
}

interface TrafficVehicle {
  root: Group;
  points: Vector3[];
  segmentLengths: number[];
  totalLength: number;
  progress: number;
  speed: number;
}

export function CityMapCanvas({
  state,
  activeTool,
  selectedServiceBuildingKind,
  onBuildTiles,
  onDemolishTiles,
  onPlaceServiceBuilding,
}: CityMapCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cameraApiRef = useRef<CameraControlsApi | null>(null);
  const buildLayerRef = useRef<Group | null>(null);
  const treeVisualsRef = useRef<TreeVisuals | null>(null);
  const treeOccupancySignatureRef = useRef("");
  const trafficLayerRef = useRef<Group | null>(null);
  const trafficVehiclesRef = useRef<TrafficVehicle[]>([]);
  const trafficSignatureRef = useRef("");
  const utilityOverlayLayerRef = useRef<Group | null>(null);
  const latestRef = useRef({
    state,
    activeTool,
    selectedServiceBuildingKind,
    onBuildTiles,
    onDemolishTiles,
    onPlaceServiceBuilding,
  });
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
    buildLayerRef.current = resources.buildLayer;
    treeVisualsRef.current = resources.trees;
    treeOccupancySignatureRef.current = getTreeOccupancySignature(
      latestRef.current.state,
    );
    trafficLayerRef.current = resources.trafficLayer;
    utilityOverlayLayerRef.current = resources.utilityOverlayLayer;
    updateBuildVisuals(resources.buildLayer, latestRef.current.state);
    trafficVehiclesRef.current = updateTrafficVisuals(
      resources.trafficLayer,
      latestRef.current.state,
    );
    trafficSignatureRef.current = getTrafficSignature(latestRef.current.state);
    updateUtilityOverlay(
      resources.utilityOverlayLayer,
      latestRef.current.state,
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
    let painting = false;
    let routeAxis: CardinalAxis = "horizontal";
    let routeStartTile: MapTile | null = null;
    let routePaintStarted = false;

    const setPointerFromEvent = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
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
        getServiceCategory(tool) !== null
          ? SERVICE_BUILDING_DEFINITIONS[latestRef.current.selectedServiceBuildingKind]
          : null;
      const size = serviceDefinition
        ? serviceDefinition.footprint - 0.1
        : !kind || kind === "road"
          ? 0.92
          : kind === "avenue"
            ? 0.92
            : 2.9;
      const avenueWidth = kind === "avenue" ? 1.92 : size;
      buildPreview.scale.set(
        kind === "avenue" && routeAxis === "vertical" ? avenueWidth : size,
        1,
        kind === "avenue" && routeAxis === "horizontal" ? avenueWidth : size,
      );
      buildPreview.position.set(
        -HALF_MAP +
          tile.column +
          (kind === "avenue" && routeAxis === "vertical"
            ? 1
            : (serviceDefinition?.footprint ?? 1) / 2),
        0.84,
        -HALF_MAP +
          tile.row +
          (kind === "avenue" && routeAxis === "horizontal"
            ? 1
            : (serviceDefinition?.footprint ?? 1) / 2),
      );
      if (tool === "bulldozer") {
        buildPreview.material.color.setHex(
          canDemolishAt(latestRef.current.state, tile) ? 0xd94b3e : 0x7d8984,
        );
      } else if (getServiceCategory(tool)) {
        const serviceCategory = getServiceCategory(tool)!;
        buildPreview.material.color.setHex(
          placeServiceBuilding(
            latestRef.current.state,
            latestRef.current.selectedServiceBuildingKind,
            tile,
          ).ok
            ? getServicePreviewColor(serviceCategory)
            : 0xe45d4c,
        );
      } else if (kind) {
        const previewTiles = getBrushTiles(kind, tile, routeAxis);
        buildPreview.material.color.setHex(
          previewTiles.every((candidate) =>
            canBuildAt(latestRef.current.state, kind, candidate),
          ) &&
            latestRef.current.state.budget >= getBuildCost(kind) * previewTiles.length
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
      const brushTiles = kind ? getBrushTiles(kind, tile, routeAxis) : [tile];
      if (kind === "avenue") {
        const brushKey = `avenue:${routeAxis}:${tile.column}:${tile.row}`;
        if (paintedTileKeys.has(brushKey)) return;
        paintedTileKeys.add(brushKey);
      }
      const requestedTiles = brushTiles.filter((candidate) => {
        if (kind === "avenue") return true;
        const key = `${candidate.column}:${candidate.row}`;
        if (paintedTileKeys.has(key)) return false;
        paintedTileKeys.add(key);
        return true;
      });
      if (requestedTiles.length > 0) {
        if (tool === "bulldozer") {
          latestRef.current.onDemolishTiles(requestedTiles);
        } else if (getServiceCategory(tool)) {
          latestRef.current.onPlaceServiceBuilding(
            latestRef.current.selectedServiceBuildingKind,
            tile,
          );
        } else if (kind) {
          latestRef.current.onBuildTiles(kind, requestedTiles);
        }
      }
    };

    const paintStraightRoute = (kind: "road" | "avenue", target: MapTile) => {
      if (!routeStartTile) return;
      const routeTiles = getStraightLineTiles(routeStartTile, target, routeAxis);

      if (kind === "avenue") {
        for (const tile of routeTiles) paintAt(tile);
        return;
      }

      const requestedTiles = routeTiles.filter((tile) => {
        const key = tileKey(tile);
        if (paintedTileKeys.has(key)) return false;
        paintedTileKeys.add(key);
        return true;
      });
      if (requestedTiles.length > 0) {
        latestRef.current.onBuildTiles("road", requestedTiles);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!isPaintTool(latestRef.current.activeTool) || event.button !== 0) return;
      const kind = getBuildKind(latestRef.current.activeTool);
      painting = true;
      paintedTileKeys.clear();
      if (kind === "road" || kind === "avenue") routeAxis = "horizontal";
      controls.enabled = false;
      renderer.domElement.setPointerCapture(event.pointerId);
      const tile = getTileAtPointer(event);
      routeStartTile = kind === "road" || kind === "avenue" ? tile : null;
      routePaintStarted = false;
      updateBuildPreview(tile);
      if (kind !== "avenue") paintAt(tile);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (isPaintTool(latestRef.current.activeTool)) {
        const tile = getTileAtPointer(event);
        const kind = getBuildKind(latestRef.current.activeTool);
        let previewTile = tile;
        if (
          painting &&
          (kind === "road" || kind === "avenue") &&
          routeStartTile &&
          tile
        ) {
          const columnDistance = Math.abs(tile.column - routeStartTile.column);
          const rowDistance = Math.abs(tile.row - routeStartTile.row);
          if (columnDistance > 0 || rowDistance > 0) {
            if (!routePaintStarted && Math.max(columnDistance, rowDistance) >= 2) {
              routeAxis = getDominantCardinalAxis(routeStartTile, tile);
              routePaintStarted = true;
              if (kind === "avenue") paintAt(routeStartTile);
            }
            if (routePaintStarted) {
              previewTile =
                routeAxis === "horizontal"
                  ? { column: tile.column, row: routeStartTile.row }
                  : { column: routeStartTile.column, row: tile.row };
              paintStraightRoute(kind, previewTile);
            }
          }
        }
        updateBuildPreview(previewTile);
        if (
          painting &&
          kind !== "road" &&
          kind !== "avenue" &&
          !getServiceCategory(latestRef.current.activeTool)
        )
          paintAt(tile);
        renderer.domElement.style.cursor = "crosshair";
        return;
      }
      if (event.buttons !== 0) return;
      renderer.domElement.style.cursor = "grab";
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (painting) {
        if (
          getBuildKind(latestRef.current.activeTool) === "avenue" &&
          !routePaintStarted
        ) {
          paintAt(routeStartTile);
        }
        painting = false;
        controls.enabled = true;
        paintedTileKeys.clear();
        routeStartTile = null;
        routePaintStarted = false;
        if (renderer.domElement.hasPointerCapture(event.pointerId)) {
          renderer.domElement.releasePointerCapture(event.pointerId);
        }
        return;
      }
    };
    const handlePointerLeave = () => {
      painting = false;
      controls.enabled = true;
      routeStartTile = null;
      routePaintStarted = false;
      buildPreview.visible = false;
      renderer.domElement.style.cursor = isPaintTool(latestRef.current.activeTool)
        ? "crosshair"
        : "grab";
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

    const clock = new Clock();
    renderer.setAnimationLoop(() => {
      controls.update();
      const frameDelta = Math.min(clock.getDelta(), 0.05);
      updateTrafficVehicles(
        trafficVehiclesRef.current,
        frameDelta * latestRef.current.state.speed,
      );
      renderer.domElement.dataset.trafficProgress =
        trafficVehiclesRef.current[0]?.progress.toFixed(3) ?? "0.000";
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
      buildLayerRef.current = null;
      treeVisualsRef.current = null;
      treeOccupancySignatureRef.current = "";
      trafficLayerRef.current = null;
      trafficVehiclesRef.current = [];
      trafficSignatureRef.current = "";
      utilityOverlayLayerRef.current = null;
      cameraApiRef.current = null;
    };
  }, []);

  useEffect(() => {
    latestRef.current = {
      state,
      activeTool,
      selectedServiceBuildingKind,
      onBuildTiles,
      onDemolishTiles,
      onPlaceServiceBuilding,
    };
    if (buildLayerRef.current) updateBuildVisuals(buildLayerRef.current, state);
    const treeOccupancySignature = getTreeOccupancySignature(state);
    if (
      treeVisualsRef.current &&
      treeOccupancySignature !== treeOccupancySignatureRef.current
    ) {
      updateTreeVisuals(treeVisualsRef.current, state);
      treeOccupancySignatureRef.current = treeOccupancySignature;
    }
    const trafficSignature = getTrafficSignature(state);
    if (trafficLayerRef.current && trafficSignature !== trafficSignatureRef.current) {
      trafficVehiclesRef.current = updateTrafficVisuals(trafficLayerRef.current, state);
      trafficSignatureRef.current = trafficSignature;
    }
    if (utilityOverlayLayerRef.current) {
      updateUtilityOverlay(utilityOverlayLayerRef.current, state, activeTool);
    }
    const canvas = hostRef.current?.querySelector("canvas");
    if (canvas) {
      canvas.style.cursor = isPaintTool(activeTool) ? "crosshair" : "grab";
      canvas.dataset.roadCount = state.roadTiles.length.toString();
      canvas.dataset.visibleTreeCount =
        treeVisualsRef.current?.visibleCount.toString() ?? "0";
      canvas.dataset.clearedTreeCount = treeVisualsRef.current
        ? (
            treeVisualsRef.current.positions.length -
            treeVisualsRef.current.visibleCount
          ).toString()
        : "0";
      canvas.dataset.roadRowCount = new Set(
        state.roadTiles.map((tile) => tile.row),
      ).size.toString();
      canvas.dataset.roadColumnCount = new Set(
        state.roadTiles.map((tile) => tile.column),
      ).size.toString();
      canvas.dataset.avenueCount = (state.avenueTiles ?? []).length.toString();
      canvas.dataset.simulationSpeed = state.speed.toString();
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
      const debt = getDebtSummary(state);
      canvas.dataset.activeLoanCount = debt.activeLoanCount.toString();
      canvas.dataset.totalDebt = debt.totalRemainingBalance.toString();
      const outsideConnection = getOutsideConnectionSummary(state);
      canvas.dataset.regionalRoadCount = REGIONAL_ROAD_TILES.length.toString();
      canvas.dataset.outsideConnected = outsideConnection.connected.toString();
      canvas.dataset.outsideConnectedZones =
        outsideConnection.connectedZoneCount.toString();
      canvas.dataset.outsideVehicleCount = trafficVehiclesRef.current.length.toString();
      const utilityOverlay = getUtilityCategory(activeTool);
      const civicOverlay = getCivicCategory(activeTool);
      canvas.dataset.utilityOverlay = utilityOverlay ?? "none";
      canvas.dataset.civicOverlay = civicOverlay ?? "none";
      canvas.dataset.landValueOverlay = (activeTool === "land-value").toString();
      canvas.dataset.utilityOverlayStatus = utilityOverlay
        ? getUtilityCapacity(state, utilityOverlay) >=
            getUtilityDemand(state, utilityOverlay) &&
          getUtilityCoverage(state, utilityOverlay).coveragePercent === 100
          ? "supplied"
          : "shortage"
        : "none";
      for (const category of ["electricity", "water", "sewage"] as const) {
        canvas.dataset[`${category}Coverage`] = getUtilityCoverage(
          state,
          category,
        ).coveragePercent.toString();
      }
      for (const category of ["fire", "police", "health", "education"] as const) {
        const coverage = getCivicCoverage(state, category);
        canvas.dataset[`${category}Coverage`] = coverage.coveragePercent.toString();
      }
      canvas.dataset.fireStationCount = state.serviceBuildings
        .filter((building) => building.kind === "fire-station")
        .length.toString();
      canvas.dataset.policeStationCount = state.serviceBuildings
        .filter((building) => building.kind === "police-station")
        .length.toString();
      canvas.dataset.clinicCount = state.serviceBuildings
        .filter((building) => building.kind === "clinic")
        .length.toString();
      canvas.dataset.schoolCount = state.serviceBuildings
        .filter(
          (building) =>
            building.kind === "elementary-school" || building.kind === "high-school",
        )
        .length.toString();
    }
  }, [
    activeTool,
    onBuildTiles,
    onDemolishTiles,
    onPlaceServiceBuilding,
    selectedServiceBuildingKind,
    state,
  ]);

  return (
    <div
      className="map-viewport"
      ref={hostRef}
      role="img"
      aria-label="Perspektivische 3D-Stadtkarte"
    >
      <DemandIndicator state={state} />
      <OutsideConnectionBadge state={state} />
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

function OutsideConnectionBadge({ state }: { state: GameState }) {
  const connection = getOutsideConnectionSummary(state);
  return (
    <div
      className={`outside-connection ${connection.connected ? "is-connected" : "is-disconnected"}`}
      role="status"
      aria-label={`Aussenverbindung: ${connection.connected ? "verbunden" : "Anschluss fehlt"}`}
    >
      {connection.connected ? (
        <Route aria-hidden="true" />
      ) : (
        <Unplug aria-hidden="true" />
      )}
      <span>
        <small>Aussenverbindung</small>
        <strong>{connection.connected ? "Verbunden" : "Anschluss fehlt"}</strong>
      </span>
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

  addRegionalOutsideConnection(world, state.cityName);

  const trees = addTrees(world);
  updateTreeVisuals(trees, state);

  const buildLayer = new Group();
  buildLayer.name = "city-buildings";
  world.add(buildLayer);

  const trafficLayer = new Group();
  trafficLayer.name = "regional-traffic";
  world.add(trafficLayer);

  const utilityOverlayLayer = new Group();
  utilityOverlayLayer.name = "utility-overlay";
  world.add(utilityOverlayLayer);

  return {
    world,
    buildLayer,
    trafficLayer,
    utilityOverlayLayer,
    trees,
    dispose: () => {
      scene.remove(world);
      disposeObject(world);
    },
  };
}

function addRegionalOutsideConnection(world: Group, cityName: string): void {
  const entry = tileWorldPosition(REGIONAL_ROAD_ENTRY_TILE);
  const gateway = tileWorldPosition(REGIONAL_ROAD_CONNECTION_TILE);
  const roadY = terrainHeight(entry.x, entry.z) + 0.13;

  const approachGround = new Mesh(
    new BoxGeometry(17, 0.5, 7.5),
    new MeshStandardMaterial({ color: 0x54754d, roughness: 1 }),
  );
  approachGround.position.set(entry.x - 8.3, roadY - 0.34, entry.z);
  approachGround.receiveShadow = true;

  const approach = new Mesh(
    new BoxGeometry(17, 0.18, 1.44),
    new MeshStandardMaterial({ color: 0x303735, roughness: 0.86 }),
  );
  approach.position.set(entry.x - 8.3, roadY, entry.z);
  approach.receiveShadow = true;
  approach.userData.protectedRoad = true;
  world.add(approachGround, approach);

  const regionalRoad = new InstancedMesh(
    new BoxGeometry(1.02, 0.18, 1.44),
    new MeshStandardMaterial({ color: 0x303735, roughness: 0.86 }),
    REGIONAL_ROAD_TILES.length,
  );
  const roadMatrix = new Matrix4();
  const roadHelper = new Object3D();
  REGIONAL_ROAD_TILES.forEach((tile, index) => {
    const position = tileWorldPosition(tile);
    roadHelper.position.set(
      position.x,
      terrainHeight(position.x, position.z) + 0.13,
      position.z,
    );
    roadHelper.updateMatrix();
    roadMatrix.copy(roadHelper.matrix);
    regionalRoad.setMatrixAt(index, roadMatrix);
  });
  regionalRoad.instanceMatrix.needsUpdate = true;
  regionalRoad.receiveShadow = true;
  regionalRoad.userData.protectedRoad = true;
  world.add(regionalRoad);

  const markingMaterial = new MeshBasicMaterial({ color: 0xf2d35c });
  for (let x = entry.x - 16; x <= gateway.x; x += 2) {
    const marking = new Mesh(new BoxGeometry(0.92, 0.025, 0.08), markingMaterial);
    marking.position.set(
      x,
      terrainHeight(Math.max(x, entry.x), entry.z) + 0.24,
      entry.z,
    );
    marking.renderOrder = 4;
    world.add(marking);
  }

  const edgeMaterial = new MeshBasicMaterial({ color: 0xe7ece8 });
  for (const zOffset of [-0.61, 0.61]) {
    const edge = new Mesh(new BoxGeometry(24, 0.025, 0.055), edgeMaterial.clone());
    edge.position.set(entry.x - 4.5, roadY + 0.1, entry.z + zOffset);
    edge.renderOrder = 4;
    world.add(edge);
  }

  const gatewayX = gateway.x + 0.42;
  const poleMaterial = new MeshStandardMaterial({ color: 0xb8c3bf, roughness: 0.7 });
  for (const zOffset of [-1.25, 1.25]) {
    const pole = new Mesh(new CylinderGeometry(0.09, 0.12, 3.1, 10), poleMaterial);
    pole.position.set(
      gatewayX,
      terrainHeight(gatewayX, gateway.z) + 1.62,
      gateway.z + zOffset,
    );
    pole.castShadow = true;
    world.add(pole);
  }

  const sign = new Sprite(
    new SpriteMaterial({
      map: createRoadSignTexture(cityName),
      color: 0xffffff,
      depthTest: true,
    }),
  );
  sign.position.set(gatewayX, terrainHeight(gatewayX, gateway.z) + 3.05, gateway.z);
  sign.scale.set(3.5, 1.05, 1);
  sign.renderOrder = 6;
  world.add(sign);

  const junction = new Mesh(
    new BoxGeometry(1.15, 0.12, 1.8),
    new MeshStandardMaterial({ color: 0x3b4542, roughness: 0.84 }),
  );
  junction.position.set(
    gateway.x + 0.45,
    terrainHeight(gateway.x, gateway.z) + 0.17,
    gateway.z,
  );
  junction.receiveShadow = true;
  junction.userData.protectedRoad = true;
  world.add(junction);
}

function createRoadSignTexture(cityName: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  if (!context) return new CanvasTexture(canvas);

  context.fillStyle = "#205f43";
  context.fillRect(5, 5, 502, 150);
  context.strokeStyle = "#f4f7f3";
  context.lineWidth = 10;
  context.strokeRect(10, 10, 492, 140);
  context.fillStyle = "#ffffff";
  context.font = "700 66px Segoe UI, Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(cityName, 256, 84, 450);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function getTrafficSignature(state: GameState): string {
  const roads = state.roadTiles.map(tileKey).sort().join("|");
  const zones = state.zoneTiles
    .map((tile) => `${tileKey(tile)}:${tile.zone}`)
    .sort()
    .join("|");
  return `${roads}#${zones}`;
}

function getTreeOccupancySignature(state: GameState): string {
  const services = state.serviceBuildings
    .map((building) => `${building.kind}:${tileKey(building)}`)
    .sort()
    .join("|");
  return `${getTrafficSignature(state)}#${services}`;
}

function updateTrafficVisuals(layer: Group, state: GameState): TrafficVehicle[] {
  for (const child of [...layer.children]) {
    layer.remove(child);
    disposeObject(child);
  }

  const connection = getOutsideConnectionSummary(state);
  if (!connection.connected) return [];

  const vehicles: TrafficVehicle[] = [];
  const generalRoute = getOutsideRoadRoute(state);
  const residentialRoute = getOutsideRoadRoute(state, "residential");
  const carRoute = residentialRoute.length > 0 ? residentialRoute : generalRoute;
  vehicles.push(
    createTrafficVehicle(layer, createVehiclePath(carRoute, -0.2), "car", 0),
  );

  if (connection.commercial + connection.industrial > 0) {
    const industrialRoute = getOutsideRoadRoute(state, "industrial");
    const commercialRoute = getOutsideRoadRoute(state, "commercial");
    const freightRoute =
      industrialRoute.length > 0
        ? industrialRoute
        : commercialRoute.length > 0
          ? commercialRoute
          : generalRoute;
    vehicles.push(
      createTrafficVehicle(layer, createVehiclePath(freightRoute, 0.2), "truck", 7.5),
    );
  }

  updateTrafficVehicles(vehicles, 0);
  return vehicles;
}

function createVehiclePath(cityRoute: MapTile[], laneOffset: number): Vector3[] {
  const entry = tileWorldPosition(REGIONAL_ROAD_ENTRY_TILE);
  const outsidePoints = [entry.x - 16, entry.x - 10, entry.x - 4].map(
    (x) =>
      new Vector3(
        x,
        terrainHeight(Math.max(x, entry.x), entry.z) + 0.42,
        entry.z + laneOffset,
      ),
  );
  const roadPoints = [...REGIONAL_ROAD_TILES, ...cityRoute].map((tile) => {
    const position = tileWorldPosition(tile);
    return new Vector3(
      position.x,
      terrainHeight(position.x, position.z) + 0.42,
      position.z + laneOffset,
    );
  });
  return [...outsidePoints, ...roadPoints];
}

function createTrafficVehicle(
  layer: Group,
  points: Vector3[],
  kind: "car" | "truck",
  offset: number,
): TrafficVehicle {
  const root = new Group();
  root.name = kind === "car" ? "arrival-car" : "freight-truck";

  const body = new Mesh(
    new BoxGeometry(
      kind === "car" ? 0.48 : 0.58,
      kind === "car" ? 0.26 : 0.38,
      kind === "car" ? 0.82 : 1.18,
    ),
    new MeshStandardMaterial({
      color: kind === "car" ? 0xc94f42 : 0xd4a13f,
      roughness: 0.58,
      metalness: 0.08,
    }),
  );
  body.position.y = kind === "car" ? 0.18 : 0.25;
  body.castShadow = true;
  root.add(body);

  const cabin = new Mesh(
    new BoxGeometry(
      kind === "car" ? 0.4 : 0.5,
      kind === "car" ? 0.24 : 0.34,
      kind === "car" ? 0.42 : 0.45,
    ),
    new MeshStandardMaterial({
      color: kind === "car" ? 0xbad7dc : 0xe3e8e4,
      roughness: 0.36,
    }),
  );
  cabin.position.set(0, kind === "car" ? 0.38 : 0.47, kind === "car" ? -0.04 : -0.38);
  cabin.castShadow = true;
  root.add(cabin);

  if (kind === "truck") {
    const cargo = new Mesh(
      new BoxGeometry(0.6, 0.58, 0.68),
      new MeshStandardMaterial({ color: 0x667a70, roughness: 0.78 }),
    );
    cargo.position.set(0, 0.48, 0.3);
    cargo.castShadow = true;
    root.add(cargo);
  }

  const segmentLengths = points
    .slice(1)
    .map((point, index) => point.distanceTo(points[index]));
  const totalLength = segmentLengths.reduce((total, length) => total + length, 0);
  const vehicle = {
    root,
    points,
    segmentLengths,
    totalLength,
    progress: offset,
    speed: kind === "car" ? 3.6 : 2.55,
  };
  layer.add(root);
  return vehicle;
}

function updateTrafficVehicles(vehicles: TrafficVehicle[], delta: number): void {
  for (const vehicle of vehicles) {
    if (vehicle.totalLength <= 0) continue;
    vehicle.progress =
      (vehicle.progress + delta * vehicle.speed) % (vehicle.totalLength * 2);
    const returning = vehicle.progress > vehicle.totalLength;
    const distance = returning
      ? vehicle.totalLength * 2 - vehicle.progress
      : vehicle.progress;
    const position = sampleVehiclePath(vehicle, distance);
    const lookDistance = clamp(
      distance + (returning ? -0.2 : 0.2),
      0,
      vehicle.totalLength,
    );
    const lookAt = sampleVehiclePath(vehicle, lookDistance);
    vehicle.root.position.copy(position);
    if (position.distanceToSquared(lookAt) > 0.0001) {
      vehicle.root.lookAt(lookAt.x, position.y, lookAt.z);
    }
  }
}

function sampleVehiclePath(vehicle: TrafficVehicle, distance: number): Vector3 {
  let remaining = distance;
  for (let index = 0; index < vehicle.segmentLengths.length; index += 1) {
    const segmentLength = vehicle.segmentLengths[index];
    if (remaining <= segmentLength) {
      return vehicle.points[index]
        .clone()
        .lerp(
          vehicle.points[index + 1],
          segmentLength === 0 ? 0 : remaining / segmentLength,
        );
    }
    remaining -= segmentLength;
  }
  return vehicle.points.at(-1)?.clone() ?? new Vector3();
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

function addTrees(world: Group): TreeVisuals {
  const treePositions: TreePosition[] = [];
  for (let x = -HALF_MAP + 2; x < HALF_MAP - 2; x += 3.6) {
    for (let z = -HALF_MAP + 2; z < HALF_MAP - 2; z += 3.6) {
      const jitterX = (noise01(x * 1.8, z) - 0.5) * 1.6;
      const jitterZ = (noise01(z * 1.4, x) - 0.5) * 1.6;
      const worldX = x + jitterX;
      const worldZ = z + jitterZ;
      if (noise01(x, z) < 0.78) continue;
      treePositions.push({
        x: worldX,
        y: terrainHeight(worldX, worldZ),
        z: worldZ,
        scale: 0.78 + noise01(z * 2, x * 2) * 0.52,
        rotation: noise01(worldX * 3, worldZ * 3) * Math.PI,
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

  world.add(trunk, crown);

  return {
    positions: treePositions,
    trunk,
    crown,
    visibleCount: treePositions.length,
  };
}

function updateTreeVisuals(trees: TreeVisuals, state: GameState): void {
  const occupiedTiles = new Set([
    ...REGIONAL_ROAD_TILES.map(tileKey),
    ...state.roadTiles.map(tileKey),
    ...state.zoneTiles.map(tileKey),
    ...state.serviceBuildings.flatMap((building) =>
      getServiceFootprintTiles(building.kind, building).map(tileKey),
    ),
  ]);
  const helper = new Object3D();
  let visibleIndex = 0;

  for (const tree of trees.positions) {
    if (isTreeCleared(tree, occupiedTiles)) continue;

    helper.position.set(tree.x, tree.y + 0.62 * tree.scale, tree.z);
    helper.scale.setScalar(tree.scale);
    helper.rotation.set(0, tree.rotation, 0);
    helper.updateMatrix();
    trees.trunk.setMatrixAt(visibleIndex, helper.matrix);

    helper.position.y = tree.y + 2.15 * tree.scale;
    helper.updateMatrix();
    trees.crown.setMatrixAt(visibleIndex, helper.matrix);
    visibleIndex += 1;
  }

  trees.visibleCount = visibleIndex;
  trees.trunk.count = visibleIndex;
  trees.crown.count = visibleIndex;
  trees.trunk.instanceMatrix.needsUpdate = true;
  trees.crown.instanceMatrix.needsUpdate = true;
  trees.trunk.computeBoundingSphere();
  trees.crown.computeBoundingSphere();
}

function isTreeCleared(tree: TreePosition, occupiedTiles: Set<string>): boolean {
  const treeColumn = Math.floor(tree.x + HALF_MAP);
  const treeRow = Math.floor(tree.z + HALF_MAP);
  const clearance = 1.1;

  for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      const tile = {
        column: treeColumn + columnOffset,
        row: treeRow + rowOffset,
      };
      if (!occupiedTiles.has(tileKey(tile))) continue;
      const center = tileWorldPosition(tile);
      if (
        Math.abs(tree.x - center.x) <= clearance &&
        Math.abs(tree.z - center.z) <= clearance
      ) {
        return true;
      }
    }
  }
  return false;
}

function updateBuildVisuals(layer: Group, state: GameState): void {
  for (const child of [...layer.children]) {
    layer.remove(child);
    disposeObject(child);
  }

  const helper = new Object3D();
  const developmentByKey = new Map(
    getZoneDevelopments(state).map((development) => [
      tileKey(development.tile),
      development,
    ]),
  );

  const avenueTiles = state.avenueTiles ?? [];
  const avenueKeys = new Set(avenueTiles.map(tileKey));
  const regularRoadTiles = state.roadTiles.filter(
    (tile) => !avenueKeys.has(tileKey(tile)),
  );

  if (regularRoadTiles.length > 0) {
    const roads = new InstancedMesh(
      new BoxGeometry(0.94, 0.16, 0.94),
      new MeshStandardMaterial({ color: 0x39413f, roughness: 0.9 }),
      regularRoadTiles.length,
    );
    roads.castShadow = true;
    roads.receiveShadow = true;
    regularRoadTiles.forEach((tile, index) => {
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

  if (avenueTiles.length > 0) {
    const avenues = new InstancedMesh(
      new BoxGeometry(0.99, 0.19, 0.99),
      new MeshStandardMaterial({ color: 0x303a38, roughness: 0.86 }),
      avenueTiles.length,
    );
    const laneMarkings = new InstancedMesh(
      new BoxGeometry(0.07, 0.025, 0.55),
      new MeshStandardMaterial({ color: 0xe5d8a3, roughness: 0.72 }),
      avenueTiles.length,
    );
    avenues.castShadow = true;
    avenues.receiveShadow = true;
    avenueTiles.forEach((tile, index) => {
      const position = tileWorldPosition(tile);
      const height = terrainHeight(position.x, position.z);
      helper.position.set(position.x, height + 0.135, position.z);
      helper.rotation.set(0, 0, 0);
      helper.updateMatrix();
      avenues.setMatrixAt(index, helper.matrix);

      const horizontalNeighbours =
        Number(avenueKeys.has(`${tile.column - 1}:${tile.row}`)) +
        Number(avenueKeys.has(`${tile.column + 1}:${tile.row}`));
      const verticalNeighbours =
        Number(avenueKeys.has(`${tile.column}:${tile.row - 1}`)) +
        Number(avenueKeys.has(`${tile.column}:${tile.row + 1}`));
      helper.position.y = height + 0.245;
      helper.rotation.y = horizontalNeighbours >= verticalNeighbours ? Math.PI / 2 : 0;
      helper.updateMatrix();
      laneMarkings.setMatrixAt(index, helper.matrix);
    });
    avenues.instanceMatrix.needsUpdate = true;
    laneMarkings.instanceMatrix.needsUpdate = true;
    layer.add(avenues, laneMarkings);
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
      addZoneBuilding(layer, tile, index, developmentByKey.get(tileKey(tile)));
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

  if (state.zoneTiles.length === 0) return;
  const utilityCategory = getUtilityCategory(tool);
  const utilityCoverage = utilityCategory
    ? new Set(getUtilityCoverage(state, utilityCategory).suppliedZoneKeys)
    : null;
  const civicCategory = getCivicCategory(tool);
  const civicCoverage = civicCategory
    ? new Set(getCivicCoverage(state, civicCategory).coveredZoneKeys)
    : null;
  const developments = tool === "land-value" ? getZoneDevelopments(state) : [];
  const developmentByKey = new Map(
    developments.map((development) => [tileKey(development.tile), development]),
  );
  if (!utilityCategory && !civicCategory && tool !== "land-value") return;

  const overlay = new InstancedMesh(
    new BoxGeometry(0.96, 0.12, 0.96),
    new MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
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
    const development = developmentByKey.get(tileKey(tile));
    const color =
      tool === "land-value" && development
        ? getLandValueColor(development.landValue)
        : civicCoverage
          ? civicCoverage.has(tileKey(tile))
            ? 0x56d17b
            : 0xe05b4f
          : utilityCoverage
            ? utilityCoverage.has(tileKey(tile))
              ? 0x56d17b
              : 0xe05b4f
            : 0xe05b4f;
    overlay.setColorAt(index, new Color(color));
  });
  overlay.instanceMatrix.needsUpdate = true;
  if (overlay.instanceColor) overlay.instanceColor.needsUpdate = true;
  layer.add(overlay);
}

function getLandValueColor(value: number): number {
  if (value >= 70) return 0x4fc982;
  if (value >= 40) return 0xe0b44f;
  return 0xd96152;
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

  if (
    building.kind === "fire-station" ||
    building.kind === "police-station" ||
    building.kind === "clinic" ||
    building.kind === "hospital" ||
    building.kind === "elementary-school" ||
    building.kind === "high-school"
  ) {
    addCivicServiceBuilding(layer, building, x, z, ground);
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

function addCivicServiceBuilding(
  layer: Group,
  building: ServiceBuilding,
  x: number,
  z: number,
  ground: number,
): void {
  if (building.kind === "fire-station") {
    const hall = createServiceBox(2.5, 1.05, 2.15, 0xc9c8bc);
    hall.position.set(x, ground + 0.62, z);
    const roof = createServiceBox(2.7, 0.18, 2.35, 0xa4463d);
    roof.position.set(x, ground + 1.25, z);
    for (const offset of [-0.62, 0.62]) {
      const door = createServiceBox(0.85, 0.72, 0.08, 0x8c332e);
      door.position.set(x + offset, ground + 0.46, z + 1.1);
      layer.add(door);
    }
    const engine = createServiceVehicle("fire");
    engine.position.set(x, ground + 0.24, z + 1.72);
    layer.add(hall, roof, engine);
    return;
  }

  if (building.kind === "police-station") {
    const station = createServiceBox(2.55, 1.2, 2.2, 0x7e94a1);
    station.position.set(x, ground + 0.7, z);
    const entrance = createServiceBox(0.85, 0.78, 0.15, 0x325678);
    entrance.position.set(x, ground + 0.5, z + 1.16);
    const car = createServiceVehicle("police");
    car.position.set(x + 0.72, ground + 0.2, z + 1.62);
    layer.add(station, entrance, car);
    return;
  }

  if (building.kind === "clinic" || building.kind === "hospital") {
    const large = building.kind === "hospital";
    const facility = createServiceBox(
      large ? 3.45 : 2.5,
      large ? 1.75 : 1.15,
      large ? 3.25 : 2.3,
      0xe0e8e4,
    );
    facility.position.set(x, ground + (large ? 0.98 : 0.68), z);
    const vertical = createServiceBox(0.22, 0.75, 0.12, 0x3e9a88);
    vertical.position.set(x, ground + (large ? 1.15 : 0.8), z + (large ? 1.68 : 1.2));
    const horizontal = createServiceBox(0.72, 0.22, 0.12, 0x3e9a88);
    horizontal.position.copy(vertical.position);
    layer.add(facility, vertical, horizontal);
    if (large) {
      const ambulance = createServiceVehicle("ambulance");
      ambulance.position.set(x + 1.05, ground + 0.24, z + 2.0);
      layer.add(ambulance);
    }
    return;
  }

  const highSchool = building.kind === "high-school";
  const school = createServiceBox(
    highSchool ? 3.35 : 2.5,
    highSchool ? 1.45 : 1.05,
    highSchool ? 2.8 : 2.25,
    highSchool ? 0x9b6d57 : 0xb77a59,
  );
  school.position.set(x, ground + (highSchool ? 0.83 : 0.63), z);
  const schoolRoof = createServiceBox(
    highSchool ? 3.55 : 2.7,
    0.18,
    highSchool ? 3.0 : 2.45,
    0xd3a84d,
  );
  schoolRoof.position.set(x, ground + (highSchool ? 1.65 : 1.25), z);
  const yard = createServiceBox(highSchool ? 2.6 : 1.8, 0.08, 0.85, 0x719b63);
  yard.position.set(x, ground + 0.12, z + (highSchool ? 1.88 : 1.55));
  layer.add(school, schoolRoof, yard);
}

function createServiceVehicle(kind: "fire" | "police" | "ambulance"): Group {
  const vehicle = new Group();
  const colors = {
    fire: 0xc7463c,
    police: 0x3e628c,
    ambulance: 0xe7ece8,
  };
  const body = createServiceBox(0.55, 0.3, kind === "fire" ? 1.05 : 0.82, colors[kind]);
  body.position.y = 0.18;
  const cabin = createServiceBox(0.47, 0.24, 0.38, 0xb9d4d6);
  cabin.position.set(0, 0.38, -0.2);
  const lightBar = createServiceBox(
    0.38,
    0.08,
    0.12,
    kind === "fire" ? 0x315da1 : 0x4aa8c0,
  );
  lightBar.position.set(0, 0.55, -0.08);
  vehicle.add(body, cabin, lightBar);
  return vehicle;
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

function addZoneBuilding(
  layer: Group,
  tile: ZonedTile,
  index: number,
  development?: ZoneDevelopment,
): void {
  const position = tileWorldPosition(tile);
  const ground = terrainHeight(position.x, position.z);
  const level = development?.level ?? 1;
  const classification = development?.classification ?? "basic";

  if (tile.zone === "residential") {
    const buildingHeight = [0.3, 0.58, 0.95, 1.85, 3.7][level - 1];
    const widths = [0.72, 0.5, 0.68, 0.72, 0.76];
    const color =
      classification === "premium"
        ? index % 2 === 0
          ? 0xe7f0ed
          : 0xd6e8e2
        : classification === "middle"
          ? index % 2 === 0
            ? 0xe5d8bd
            : 0xcfded5
          : index % 2 === 0
            ? 0xc8b69c
            : 0xb7bbb2;
    const body = new Mesh(
      new BoxGeometry(widths[level - 1], buildingHeight, level === 1 ? 0.4 : 0.62),
      new MeshStandardMaterial({
        color,
        roughness: level >= 4 ? 0.68 : 0.92,
      }),
    );
    body.position.set(position.x, ground + 0.1 + buildingHeight / 2, position.z);
    body.castShadow = true;
    body.receiveShadow = true;

    layer.add(body);
    if (level === 1) {
      const roof = createServiceBox(0.76, 0.08, 0.44, 0xe7e0cf);
      roof.position.set(position.x, ground + buildingHeight + 0.14, position.z);
      layer.add(roof);
    } else if (level <= 3) {
      const roof = new Mesh(
        new ConeGeometry(level === 2 ? 0.43 : 0.52, 0.3, 4),
        new MeshStandardMaterial({ color: 0x8b4f42, roughness: 1 }),
      );
      roof.position.set(position.x, ground + 0.25 + buildingHeight, position.z);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      layer.add(roof);
    } else {
      const rooftop = createServiceBox(0.3, 0.16, 0.3, 0x9eb3ac);
      rooftop.position.set(position.x, ground + buildingHeight + 0.18, position.z);
      layer.add(rooftop);
    }
    return;
  }

  if (tile.zone === "commercial") {
    const buildingHeight = [0.42, 0.78, 1.45, 2.65, 4.25][level - 1];
    const color =
      classification === "premium"
        ? index % 2 === 0
          ? 0x75b9c7
          : 0x8ac7bc
        : classification === "middle"
          ? index % 2 === 0
            ? 0x719caf
            : 0x7ea0a5
          : index % 2 === 0
            ? 0x8a8f89
            : 0x797f7b;
    const body = new Mesh(
      new BoxGeometry(level === 1 ? 0.68 : 0.62, buildingHeight, 0.62),
      new MeshStandardMaterial({
        color,
        metalness: level >= 4 ? 0.22 : 0.08,
        roughness: level >= 4 ? 0.38 : 0.62,
      }),
    );
    body.position.set(position.x, ground + 0.1 + buildingHeight / 2, position.z);
    body.castShadow = true;
    body.receiveShadow = true;

    const rooftop = new Mesh(
      new BoxGeometry(0.23, 0.16, 0.23),
      new MeshStandardMaterial({ color: 0xd5e3e6, roughness: 0.7 }),
    );
    rooftop.position.set(position.x, ground + 0.16 + buildingHeight, position.z);
    rooftop.castShadow = true;
    layer.add(body, rooftop);
    return;
  }

  const industrialHeight = [0.52, 0.9, 1.35][level - 1];
  const industrialColor =
    level === 3
      ? classification === "premium"
        ? 0x7ea9a4
        : 0x879c96
      : index % 2 === 0
        ? 0x747b72
        : 0x8d806f;
  const body = new Mesh(
    new BoxGeometry(level === 1 ? 0.72 : 0.86, industrialHeight, 0.72),
    new MeshStandardMaterial({
      color: industrialColor,
      roughness: level === 3 ? 0.58 : 0.9,
      metalness: level === 3 ? 0.14 : 0,
    }),
  );
  body.position.set(position.x, ground + 0.1 + industrialHeight / 2, position.z);
  body.castShadow = true;
  body.receiveShadow = true;

  layer.add(body);
  if (level < 3) {
    const chimney = new Mesh(
      new CylinderGeometry(0.07, 0.09, level === 1 ? 0.65 : 0.95, 8),
      new MeshStandardMaterial({ color: 0x555957, roughness: 1 }),
    );
    chimney.position.set(
      position.x + 0.22,
      ground + industrialHeight + (level === 1 ? 0.32 : 0.48),
      position.z + 0.17,
    );
    chimney.castShadow = true;
    layer.add(chimney);
  } else {
    const cleanTechRoof = createServiceBox(0.58, 0.08, 0.45, 0x78b5c3);
    cleanTechRoof.position.set(
      position.x,
      ground + industrialHeight + 0.14,
      position.z,
    );
    layer.add(cleanTechRoof);
  }
}

function getBuildKind(tool: ToolId): BuildKind | null {
  if (tool === "roads") return "road";
  if (tool === "avenues") return "avenue";
  if (tool === "residential" || tool === "commercial" || tool === "industrial") {
    return tool;
  }
  return null;
}

function isPaintTool(tool: ToolId): boolean {
  return (
    tool === "bulldozer" ||
    getServiceCategory(tool) !== null ||
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

function getCivicCategory(tool: ToolId): CivicServiceCategory | null {
  if (
    tool === "fire" ||
    tool === "police" ||
    tool === "health" ||
    tool === "education"
  ) {
    return tool;
  }
  return null;
}

function getServiceCategory(
  tool: ToolId,
): ServiceCategory | CivicServiceCategory | null {
  return getUtilityCategory(tool) ?? getCivicCategory(tool);
}

function getServicePreviewColor(
  category: ServiceCategory | CivicServiceCategory,
): number {
  if (category === "electricity") return 0xe6b84a;
  if (category === "water") return 0x4d9fc1;
  if (category === "sewage") return 0x4e8f7a;
  if (category === "waste") return 0x8d8170;
  if (category === "fire") return 0xd95d4e;
  if (category === "police") return 0x4f78a8;
  if (category === "health") return 0x55a796;
  return 0xd3a84d;
}

function getBrushTiles(
  kind: BuildKind,
  center: MapTile,
  avenueAxis: "horizontal" | "vertical" = "horizontal",
): MapTile[] {
  if (kind === "road") return [center];
  if (kind === "avenue") {
    const second =
      avenueAxis === "horizontal"
        ? {
            column: center.column,
            row: center.row < MAP_TILES_PER_SIDE - 1 ? center.row + 1 : center.row - 1,
          }
        : {
            column:
              center.column < MAP_TILES_PER_SIDE - 1
                ? center.column + 1
                : center.column - 1,
            row: center.row,
          };
    return [center, second];
  }

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
  const key = tileKey(tile);
  if (
    isRegionalRoadTile(tile) ||
    state.roadTiles.some((candidate) => tileKey(candidate) === key) ||
    state.zoneTiles.some((candidate) => tileKey(candidate) === key)
  ) {
    return false;
  }

  if (state.budget < getBuildCost(kind)) return false;
  if (kind === "road" || kind === "avenue") return true;

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
  if (kind === "avenue") return 0x3f4c49;
  if (kind === "residential") return 0x57c477;
  if (kind === "commercial") return 0x4ea2c7;
  return 0xd2923e;
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
      material?: MeshBasicMaterial | MeshStandardMaterial | SpriteMaterial;
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
