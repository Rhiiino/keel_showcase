// stack_sandbox/frontend_web/src/modules/test/hooks/useStlFile.ts

// Reads a local .stl file, parses it with Three.js STLLoader, and returns
// centered geometry plus loading/error state for the test viewer.

import { useCallback, useEffect, useRef, useState } from "react";
import type { BufferGeometry } from "three";
import { IcosahedronGeometry, Vector3 } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

const STL_EXTENSION = ".stl";
const MAX_FILE_BYTES = 80 * 1024 * 1024;

export type StlMeshStats = {
  triangleCount: number;
  vertexCount: number;
  maxDimension: number;
};

export type StlFileState = {
  geometry: BufferGeometry | null;
  fileName: string | null;
  loading: boolean;
  error: string | null;
  stats: StlMeshStats | null;
};

function isStlFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(STL_EXTENSION);
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unexpected file read result"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

function buildStats(geometry: BufferGeometry): StlMeshStats {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const size = box ? box.getSize(new Vector3()) : new Vector3();
  const position = geometry.getAttribute("position");
  const vertexCount = position?.count ?? 0;

  return {
    triangleCount: Math.floor(vertexCount / 3),
    vertexCount,
    maxDimension: Math.max(size.x, size.y, size.z, 0),
  };
}

function normalizeGeometry(geometry: BufferGeometry): BufferGeometry {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box) {
    const size = box.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 2 / maxDim;
      geometry.scale(scale, scale, scale);
    }
  }
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

export function parseStlBuffer(buffer: ArrayBuffer): BufferGeometry {
  const loader = new STLLoader();
  const geometry = loader.parse(buffer);
  return normalizeGeometry(geometry);
}

function parseStlBufferAsync(buffer: ArrayBuffer): Promise<BufferGeometry> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      try {
        resolve(parseStlBuffer(buffer));
      } catch (error) {
        reject(error);
      }
    }, 0);
  });
}

function disposeGeometry(geometry: BufferGeometry | null) {
  if (geometry) {
    geometry.dispose();
  }
}

function createDemoGeometry(): BufferGeometry {
  return normalizeGeometry(new IcosahedronGeometry(1, 1));
}

export function useStlFile() {
  const loadGenerationRef = useRef(0);
  const geometryRef = useRef<BufferGeometry | null>(null);
  const [state, setState] = useState<StlFileState>({
    geometry: null,
    fileName: null,
    loading: false,
    error: null,
    stats: null,
  });

  useEffect(() => {
    return () => {
      disposeGeometry(geometryRef.current);
      geometryRef.current = null;
    };
  }, []);

  const commitGeometry = useCallback(
    (geometry: BufferGeometry, fileName: string) => {
      disposeGeometry(geometryRef.current);
      geometryRef.current = geometry;
      const stats = buildStats(geometry);

      setState({
        geometry,
        fileName,
        loading: false,
        error: null,
        stats,
      });
    },
    [],
  );

  const loadFile = useCallback(async (file: File) => {
    if (!isStlFile(file)) {
      setState((current) => ({
        ...current,
        error: "Please drop an .stl file.",
      }));
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setState((current) => ({
        ...current,
        error: "STL file is too large (max 80 MB for this test viewer).",
      }));
      return;
    }

    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const buffer = await readFileAsArrayBuffer(file);
      if (generation !== loadGenerationRef.current) {
        return;
      }

      const geometry = await parseStlBufferAsync(buffer);
      if (generation !== loadGenerationRef.current) {
        disposeGeometry(geometry);
        return;
      }

      const stats = buildStats(geometry);
      if (stats.triangleCount === 0) {
        disposeGeometry(geometry);
        setState((current) => ({
          ...current,
          loading: false,
          error: "This STL file contains no triangles.",
        }));
        return;
      }

      commitGeometry(geometry, file.name);
    } catch {
      if (generation !== loadGenerationRef.current) {
        return;
      }

      setState((current) => ({
        ...current,
        loading: false,
        error: "Could not parse this STL file.",
      }));
    }
  }, [commitGeometry]);

  const loadDemo = useCallback(() => {
    loadGenerationRef.current += 1;
    const geometry = createDemoGeometry();
    commitGeometry(geometry, "Demo icosahedron");
  }, [commitGeometry]);

  const clearModel = useCallback(() => {
    loadGenerationRef.current += 1;
    disposeGeometry(geometryRef.current);
    geometryRef.current = null;
    setState({
      geometry: null,
      fileName: null,
      loading: false,
      error: null,
      stats: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((current) => ({ ...current, error: null }));
  }, []);

  return {
    ...state,
    loadFile,
    loadDemo,
    clearModel,
    clearError,
    hasModel: state.geometry !== null,
  };
}
