import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  Position,
  Handle,
  Node,
  Edge,
  NodeProps,
  NodeTypes,
  FitViewOptions,
  MarkerType,
  EdgeProps,
  BaseEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

// -- Data types --
interface Bone {
  label: string;
  info: string;
  metadata?: string;
  children?: Bone[];
}

interface Diagram {
  id: string;
  name: string;
  creator: string;
  effectLabel: string;
  effectInfo: string;
  effectMeta?: string;
  roots: Bone[];
}

interface NodeData {
  label: string;
  info: string;
  metadata?: string;
  [key: string]: unknown;
}

// -- Custom Edge Type for straight lines --
const edgeTypes = {
  diagonal: function DiagonalEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style = {},
    markerEnd,
  }: EdgeProps) {
    const edgePath = `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
    return (
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
    );
  },
};

// -- Node Types --
const nodeTypes: NodeTypes = {
  category: function CategoryNode({ data, selected }: NodeProps) {
    return (
      <motion.div
        className={`rounded-xl border-2 bg-gradient-to-br from-white to-gray-50 shadow-xl px-6 py-3 font-bold text-gray-800 flex items-center justify-center transition-all duration-300 ${
          selected ? "ring-4 ring-blue-400 ring-opacity-60 shadow-2xl" : "hover:shadow-lg"
        }`}
        style={{
          minWidth: 130,
          minHeight: 45,
          borderColor: selected ? "#3b82f6" : "#374151"
        } as React.CSSProperties}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: selected ? 1.08 : 1, opacity: 1 }}
        transition={{
          duration: 0.4,
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        whileHover={{
          scale: 1.05,
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
        }}
      >
        <Handle type="target" position={Position.Right} style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
        <span className="text-sm font-semibold tracking-wide">{data.label as string}</span>
      </motion.div>
    );
  },
  spine: function SpineNode() {
    return (
      <motion.div
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          background: "linear-gradient(135deg, #6b7280, #374151)",
          pointerEvents: "none",
          zIndex: 2000,
          position: "relative",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      </motion.div>
    );
  },
  label: function LabelNode({ data, selected }: NodeProps) {
    return (
      <motion.div
        className={`bg-white rounded-lg shadow-md border-2 px-3 py-2 text-sm font-medium transition-all duration-300 ${
          selected ? "border-blue-400 shadow-lg" : "border-gray-300 hover:border-gray-400"
        }`}
        style={{
          minWidth: "110px",
          textAlign: "center",
          whiteSpace: "nowrap",
          background: selected ? "linear-gradient(135deg, #eff6ff, #dbeafe)" : "#ffffff",
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
      >
        <span className="text-gray-700">{data.label as string}</span>
      </motion.div>
    );
  },
  effectCircle: function EffectCircleNode({ data, selected }: NodeProps) {
    return (
      <motion.div
        className="flex items-center justify-center relative"
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: selected
            ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
            : "linear-gradient(135deg, #fcd34d, #f59e0b)",
          border: selected ? "4px solid #dc2626" : "3px solid #b45309",
          fontWeight: 700,
          fontSize: 14,
          boxShadow: selected
            ? "0 0 0 8px rgba(239, 68, 68, 0.2), 0 8px 32px rgba(0,0,0,0.3)"
            : "0 4px 20px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease",
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          color: "#92400e",
        } as React.CSSProperties}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
        whileHover={{
          scale: 1.05,
          boxShadow: "0 6px 25px rgba(0,0,0,0.25)"
        }}
      >
        <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
        <span className="text-center leading-tight font-bold tracking-wide">
          {data.label as string}
        </span>
        {/* Pulse animation ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-yellow-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    );
  },
};

const categoryColors = {
  People: "#FF6B6B",
  Process: "#4ECDC4",
  Technology: "#45B7D1",
  Environment: "#96CEB4",
  Measurement: "#a78bfa",
  Materials: "#fbbf24",
  Machine: "#f87171",
  Method: "#38bdf8",
  default: "#d1d5db",
};

const fitViewOptions: FitViewOptions = { padding: 0.18 };
// FINAL: Straight spine, more spacing, short ribs to prevent overlap/crossing
const SPINE_GAP = 180;
const SPINE_Y = 300;
const baseX = 240;
const EFFECT_RADIUS = 45;

function layoutFishbone(
  diagram: Diagram,
  categoryColors: Record<string, string>
): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const roots = diagram.roots || [];
  const nodes: Node<NodeData>[] = [];
  const edges: Edge[] = [];

  // --- Main spine: all on the same Y ---
  const SPINE_LENGTH = Math.max(roots.length, 2);
  for (let i = 0; i < SPINE_LENGTH; i++) {
    nodes.push({
      id: `spine-${i}`,
      type: "spine",
      data: { label: "", info: "", metadata: "" },
      position: { x: baseX + i * SPINE_GAP, y: SPINE_Y },
      selectable: false,
      draggable: false,
    });
    if (i > 0) {
      edges.push({
        id: `e-spine-${i - 1}-${i}`,
        source: `spine-${i - 1}`,
        target: `spine-${i}`,
        type: "straight",
        animated: false,
        style: { stroke: "#222", strokeWidth: 10 },
        zIndex: 100,
      });
    }
  }

  // Effect node
  const effectX = baseX + SPINE_GAP * SPINE_LENGTH - EFFECT_RADIUS;
  const effectY = SPINE_Y - EFFECT_RADIUS;
  nodes.push({
    id: "effect",
    type: "effectCircle",
    data: {
      label: diagram.effectLabel,
      info: diagram.effectInfo,
      metadata: diagram.effectMeta ?? "",
    },
    position: { x: effectX, y: effectY },
    style: { zIndex: 10 },
    selectable: true,
    draggable: false,
  });
  edges.push({
    id: "e-spine-effect",
    source: `spine-${SPINE_LENGTH - 1}`,
    target: "effect",
    type: "straight",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#222", width: 30, height: 30 },
    style: { stroke: "#222", strokeWidth: 10 },
    zIndex: 100,
  });

  // --- Main bones (ribs): alternate up/down, avoid overlap
  const mainBoneLen = 130; // shorter rib
  roots.forEach((bone, i) => {
    const angle = (i % 2 === 0 ? 30 : -30) * (Math.PI / 180); // ±30°
    const spineIdx = i;
    const spineNode = nodes.find((n) => n.id === `spine-${spineIdx}`);
    if (!spineNode) return;
    const rootX = spineNode.position.x;
    const rootY = spineNode.position.y;

    const boneX = rootX - Math.cos(angle) * mainBoneLen;
    const boneY = rootY + Math.sin(angle) * mainBoneLen;
    const boneId = `bone-${i}`;
    const color: string =
      categoryColors[bone.label.split(" ")[0]] || categoryColors.default;

    nodes.push({
      id: boneId,
      type: "category",
      data: { label: bone.label, info: bone.info, metadata: bone.metadata },
      position: { x: boneX, y: boneY },
      style: { borderColor: color, color, background: "#fff" },
      selectable: true,
      draggable: false,
    });

    edges.push({
      id: `e-${boneId}-spine-${spineIdx}`,
      source: boneId,
      target: `spine-${spineIdx}`,
      type: "diagonal",
      style: { stroke: color, strokeWidth: 4 },
      zIndex: 101,
    });

    // Sub-bones unchanged
    if (bone.children && bone.children.length > 0) {
      placeSubBonesFishbone(
        bone.children,
        boneId,
        nodes,
        edges,
        { x: rootX, y: rootY },
        { x: boneX, y: boneY },
        angle,
        color
      );
    }
  });

  return { nodes, edges };
}

function placeSubBonesFishbone(
  children: Bone[],
  parentId: string,
  nodes: Node<NodeData>[],
  edges: Edge[],
  boneStart: { x: number; y: number },
  boneEnd: { x: number; y: number },
  mainAngle: number,
  color: string
) {
  const dx = boneEnd.x - boneStart.x;
  const dy = boneEnd.y - boneStart.y;
  children.forEach((bone, idx) => {
    // Place at 30%, 50%, 70% along the main bone
    const t = 0.3 + 0.4 * (idx / (children.length > 1 ? children.length - 1 : 1));
    const px = boneStart.x + dx * t;
    const py = boneStart.y + dy * t;
    // Perpendicular angle: alternate above/below
    const angle = mainAngle + (idx % 2 === 0 ? Math.PI / 2 : -Math.PI / 2);
    const len = 60;
    const subX = px + Math.cos(angle) * len;
    const subY = py + Math.sin(angle) * len;

    const nodeId = `${parentId}-sub-${idx}`;
    nodes.push({
      id: nodeId,
      type: "label",
      data: { label: bone.label, info: bone.info || "", metadata: bone.metadata || "" },
      position: { x: subX, y: subY },
      draggable: false,
      selectable: true,
      style: {
        background: "#fff",
        border: "1px solid #666",
        borderRadius: "4px",
        fontWeight: 500,
        color: "#222",
        fontSize: 12,
        padding: "4px 8px",
        opacity: 1,
        pointerEvents: "auto",
        minWidth: "100px",
        textAlign: "center",
        whiteSpace: "nowrap",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      },
    });

    // Diagonal edge
    edges.push({
      id: `e-${parentId}-${nodeId}`,
      source: parentId,
      target: nodeId,
      type: "diagonal",
      style: { stroke: color, strokeWidth: 2, strokeOpacity: 0.8 },
      animated: false,
      selectable: false,
      zIndex: 1,
    });

    if (bone.children && bone.children.length > 0) {
      placeSubBonesFishbone(
        bone.children,
        nodeId,
        nodes,
        edges,
        { x: px, y: py },
        { x: subX, y: subY },
        angle,
        color
      );
    }
  });
}

// --- EditDiagram component logic ---
const EditDiagram: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [diagram, setDiagram] = useState<Diagram | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);

  const [newLabel, setNewLabel] = useState("");
  const [newInfo, setNewInfo] = useState("");
  const [newMeta, setNewMeta] = useState("");
  const [category, setCategory] = useState<keyof typeof categoryColors>("default");

  const flowWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      axios
        .get<Diagram>(`http://localhost:3001/api/diagrams/${id}`)
        .then((res) => {
          setDiagram(res.data);
          const { nodes, edges } = layoutFishbone(res.data, categoryColors);
          setNodes(nodes);
          setEdges(edges);
        })
        .catch((err) => console.error("Fetch failed:", err));
    }
  }, [id]);

  const onSelectionChange = useCallback(({ nodes }: { nodes: Node<NodeData>[] }) => {
    const node = nodes[0];
    setSelectedNode(node);

    if (node && node.type === "category") {
      setNewLabel(node.data.label.replace(/^[A-Za-z]+\s/, ""));
      setNewInfo(node.data.info);
      setNewMeta(node.data.metadata || "");
      setCategory(
        Object.keys(categoryColors).includes(node.data.label.split(" ")[0])
          ? (node.data.label.split(" ")[0] as keyof typeof categoryColors)
          : "default"
      );
    }
    if (node && node.type === "effectCircle") {
      setNewLabel(node.data.label);
      setNewInfo(node.data.info);
      setNewMeta(node.data.metadata || "");
      setCategory("default");
    }
  }, []);

  // --- Helpers for bone tree mutation ---
  function updateBoneRecursive(
    bones: Bone[],
    nodeId: string,
    updatedLabel: string,
    newInfo: string,
    newMeta: string
  ): Bone[] {
    return bones.map((bone, idx) => {
      const currentId = `bone-${idx}`;
      if (nodeId === currentId) {
        return { ...bone, label: updatedLabel, info: newInfo, metadata: newMeta };
      }
      const children = bone.children
        ? updateBoneRecursive(bone.children, nodeId, updatedLabel, newInfo, newMeta)
        : bone.children;
      return { ...bone, children };
    });
  }

  function addChildRecursive(
    bones: Bone[],
    nodeId: string,
    newBone: Bone
  ): Bone[] {
    return bones.map((bone, idx) => {
      const currentId = `bone-${idx}`;
      if (nodeId === currentId) {
        return { ...bone, children: [...(bone.children || []), newBone] };
      }
      return {
        ...bone,
        children: bone.children
          ? addChildRecursive(bone.children, nodeId, newBone)
          : bone.children,
      };
    });
  }

  function deleteBoneRecursive(bones: Bone[], nodeId: string): Bone[] {
    return bones
      .filter((bone, idx) => `bone-${idx}` !== nodeId)
      .map((bone) => ({
        ...bone,
        children: bone.children ? deleteBoneRecursive(bone.children, nodeId) : bone.children,
      }));
  }

  const updateNode = () => {
    if (!diagram || !selectedNode) return;
    let updatedLabel = newLabel.trim();
    if (selectedNode.type === "category" && category !== "default") {
      updatedLabel = `${category} ${updatedLabel}`;
    }
    const newDiagram = { ...diagram };
    if (selectedNode.id === "effect") {
      newDiagram.effectLabel = updatedLabel;
      newDiagram.effectInfo = newInfo;
      newDiagram.effectMeta = newMeta;
    } else if (selectedNode.type === "category") {
      newDiagram.roots = updateBoneRecursive(
        diagram.roots,
        selectedNode.id,
        updatedLabel,
        newInfo,
        newMeta
      );
    }
    setDiagram(newDiagram);
    const { nodes, edges } = layoutFishbone(newDiagram, categoryColors);
    setNodes(nodes);
    setEdges(edges);
    setSelectedNode(null);
  };

  const addChild = () => {
    if (!diagram || !selectedNode) return;
    const newBone: Bone = {
      label: `${category} New Bone`,
      info: "",
      metadata: "",
      children: [],
    };
    const newDiagram = { ...diagram };
    if (selectedNode.id === "effect") {
      newDiagram.roots = [...diagram.roots, newBone];
    } else {
      newDiagram.roots = addChildRecursive(diagram.roots, selectedNode.id, newBone);
    }
    setDiagram(newDiagram);
    const { nodes, edges } = layoutFishbone(newDiagram, categoryColors);
    setNodes(nodes);
    setEdges(edges);
  };

  const deleteNode = () => {
    if (!diagram || !selectedNode) return;
    if (selectedNode.id === "effect") return;
    const newDiagram = {
      ...diagram,
      roots: deleteBoneRecursive(diagram.roots, selectedNode.id),
    };
    setDiagram(newDiagram);
    const { nodes, edges } = layoutFishbone(newDiagram, categoryColors);
    setNodes(nodes);
    setEdges(edges);
    setSelectedNode(null);
  };

  const saveDiagram = () => {
    if (!diagram) return;
    axios
      .put(`http://localhost:3001/api/diagrams/${id}`, diagram)
      .then(() => alert("Diagram saved successfully!"))
      .catch((err) => console.error("Save failed:", err));
  };

  const exportDiagram = () => {
    if (flowWrapper.current) {
      html2canvas(flowWrapper.current, { scale: 2, useCORS: true })
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = `ishikawa_diagram_${id}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        })
        .catch((err) => console.error("Export failed:", err));
    }
  };

  return (
    <div
      className="relative min-h-screen h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
      ref={flowWrapper}
    >
      {/* Header with glassmorphism effect */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <motion.h1
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Ishikawa Diagram Editor
          </motion.h1>
          <motion.div
            className="flex space-x-3"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.button
              onClick={saveDiagram}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>💾</span>
              <span>Save</span>
            </motion.button>
            <motion.button
              onClick={exportDiagram}
              className="bg-gradient-to-r from-purple-500 to-violet-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>📷</span>
              <span>Export</span>
            </motion.button>
            <motion.button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-gray-500 to-slate-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>←</span>
              <span>Back</span>
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Flow Area */}
      <div className="w-full h-full pt-20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={fitViewOptions}
          panOnDrag
          className="bg-transparent"
        >
          <Background
            color="#e2e8f0"
            gap={20}
            size={1}
            style={{ opacity: 0.4 }}
          />
          <Controls
            className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg"
          />
        </ReactFlow>
      </div>

      {/* Enhanced Sidebar */}
      <AnimatePresence>
        {selectedNode &&
          (selectedNode.type === "category" || selectedNode.type === "effectCircle") && (
            <motion.div
              className="fixed right-6 top-24 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 z-30"
              initial={{ x: 400, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 400, opacity: 0, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.4
              }}
            >
              {/* Close Button */}
              <motion.button
                onClick={() => setSelectedNode(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-red-100 rounded-full flex items-center justify-center transition-all duration-300 group shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <svg
                  className="w-4 h-4 text-gray-600 group-hover:text-red-600 transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedNode.type === "effectCircle" ? "✨ Edit Effect" : "🔧 Edit Main Bone"}
                  </h3>
                </div>

                {selectedNode.type === "category" && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as keyof typeof categoryColors)
                      }
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    >
                      {Object.keys(categoryColors).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Label
                    </label>
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Enter label..."
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Info
                    </label>
                    <input
                      type="text"
                      value={newInfo}
                      onChange={(e) => setNewInfo(e.target.value)}
                      placeholder="Additional information..."
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Metadata
                    </label>
                    <input
                      type="text"
                      value={newMeta}
                      onChange={(e) => setNewMeta(e.target.value)}
                      placeholder="Optional metadata..."
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <motion.button
                    onClick={updateNode}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>✓</span>
                    <span>Update</span>
                  </motion.button>
                  <motion.button
                    onClick={addChild}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>+</span>
                    <span>Add Sub-Bone</span>
                  </motion.button>
                  {selectedNode.type === "category" && (
                    <motion.button
                      onClick={deleteNode}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Loading overlay */}
      {!diagram && (
        <motion.div
          className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-xl font-semibold text-gray-700">Loading diagram...</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default EditDiagram;