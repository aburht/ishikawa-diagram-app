// filepath: c:\Users\work\project\kla\ishikawa-app\apps\frontend\src\app\components\InteractiveSvgFishbonePage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import SVGClassicFishbone from "./SVGClassicFishbone";
import { motion } from "framer-motion";

interface Bone {
  label: string;
  info?: string;
  metadata?: string;
  children?: Bone[];
  status?: 'resolved' | 'issue' | 'pending';
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

// Helper function to sanitize diagram data for backend updates
const sanitizeDiagramForUpdate = (diagram: Diagram) => {
  const { id, creatorId, createdAt, updatedAt, ...sanitized } = diagram as any;
  return sanitized;
};

export default function InteractiveSvgFishbonePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBone, setSelectedBone] = useState<string>("");
  const [editMode, setEditMode] = useState(true); // Enable edit mode by default for interactive page
  const [selectedBoneData, setSelectedBoneData] = useState<Bone | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isOwner, setIsOwner] = useState<boolean>(false); // Track if current user owns this diagram

  // Expansion state management for +number indicators
  const [expandedBones, setExpandedBones] = useState<Set<string>>(new Set());

  // Form states
  const [editLabel, setEditLabel] = useState("");
  const [editInfo, setEditInfo] = useState("");
  const [editMetadata, setEditMetadata] = useState("");
  const [editStatus, setEditStatus] = useState<'resolved' | 'issue' | 'pending' | ''>("");

  // Success message auto-hide
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (id) {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      axios.get(`http://localhost:3001/api/diagrams/${id}`, { headers })
        .then(response => {
          const diagramData = response.data;
          setDiagram(diagramData);

          // Check if current user is the owner
          const currentUserEmail = user?.email;
          const isCurrentUserOwner = Boolean(currentUserEmail && (diagramData.creator === currentUserEmail || diagramData.creator === user?.name));
          setIsOwner(isCurrentUserOwner);

          // If not owner, disable edit mode and show read-only
          if (!isCurrentUserOwner) {
            setEditMode(false);
          }
        })
        .catch(err => {
          console.error('Failed to load diagram:', err);
          if (err.response?.status === 401) {
            navigate('/login');
          } else {
            setDiagram(null);
            alert('Failed to load diagram. Please check your connection and try again.');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, isAuthenticated, navigate]);

  const handleBoneClick = (bone: Bone, path: string, isExpandClick: boolean = false) => {
    // Handle expansion clicks (for +number indicators)
    if (isExpandClick) {
      setExpandedBones(prev => {
        const newSet = new Set(prev);
        if (newSet.has(path)) {
          newSet.delete(path); // Collapse if already expanded
        } else {
          newSet.add(path); // Expand if collapsed
        }
        return newSet;
      });
      return;
    }

    // Handle regular bone clicks (for editing)
    if (!editMode || !isOwner) {
      // Show message if user tries to edit but isn't the owner
      if (!isOwner) {
        alert('You can only edit diagrams that you created.');
      }
      return;
    }
    setSelectedBone(path);
    setSelectedBoneData(bone);
    setEditLabel(bone.label);
    setEditInfo(bone.info || "");
    setEditMetadata(bone.metadata || "");
    setEditStatus(bone.status || "");
  };

  const findAndUpdateBone = (bones: Bone[], path: string, updatedBone: Bone): Bone[] => {
    const pathParts = path.split('-');

    // Skip 'bone' prefix and get the actual indices
    const indices = pathParts.slice(1).map(p => parseInt(p)).filter(i => !isNaN(i));

    if (indices.length === 0) {
      return bones;
    }

    const boneIndex = indices[0];

    if (boneIndex < 0 || boneIndex >= bones.length) {
      return bones;
    }

    if (indices.length === 1) {
      // Update main category bone
      const newBones = [...bones];
      newBones[boneIndex] = updatedBone;
      return newBones;
    } else {
      // Update nested bone
      const newBones = [...bones];
      const remainingIndices = indices.slice(1);
      const childPath = 'bone-' + remainingIndices.join('-');

      if (newBones[boneIndex] && newBones[boneIndex].children) {
        newBones[boneIndex] = {
          ...newBones[boneIndex],
          children: findAndUpdateBone(newBones[boneIndex].children!, childPath, updatedBone)
        };
      }
      return newBones;
    }
  };  const findAndDeleteBone = (bones: Bone[], path: string): Bone[] => {
    const pathParts = path.split('-');

    // Skip 'bone' prefix and get the actual indices
    const indices = pathParts.slice(1).map(p => parseInt(p)).filter(i => !isNaN(i));

    if (indices.length === 0) {
      return bones;
    }

    const boneIndex = indices[0];

    if (boneIndex < 0 || boneIndex >= bones.length) {
      return bones;
    }

    if (indices.length === 1) {
      // Delete main category bone
      return bones.filter((_, index) => index !== boneIndex);
    } else {
      // Delete nested bone
      const newBones = [...bones];
      const remainingIndices = indices.slice(1);

      if (newBones[boneIndex] && newBones[boneIndex].children) {
        // Recursively delete from children
        const childPath = 'bone-' + remainingIndices.join('-');
        newBones[boneIndex] = {
          ...newBones[boneIndex],
          children: findAndDeleteBone(newBones[boneIndex].children!, childPath)
        };
      }
      return newBones;
    }
  };

  const findBoneByPath = (bones: Bone[], path: string): Bone | null => {
    const pathParts = path.split('-');

    // Skip 'bone' prefix and get the actual indices
    const indices = pathParts.slice(1).map(p => parseInt(p)).filter(i => !isNaN(i));

    if (indices.length === 0) {
      return null;
    }

    let currentBones = bones;
    let currentBone: Bone | null = null;

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];

      if (index < 0 || index >= currentBones.length) {
        return null;
      }

      currentBone = currentBones[index];

      if (i < indices.length - 1) {
        // Not the last index, need to go deeper
        if (!currentBone.children) {
          return null;
        }
        currentBones = currentBone.children;
      }
    }

    return currentBone;
  };

  const updateBone = () => {
    if (!diagram || !selectedBoneData) return;

    console.log('Updating bone:', selectedBone, { editLabel, editInfo, editMetadata });

    const updatedBone: Bone = {
      ...selectedBoneData,
      label: editLabel,
      info: editInfo,
      metadata: editMetadata,
      status: editStatus || undefined
    };

    const updatedRoots = findAndUpdateBone(diagram.roots, selectedBone, updatedBone);
    const updatedDiagram = { ...diagram, roots: updatedRoots };

    // Update in backend
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const sanitizedPayload = sanitizeDiagramForUpdate(updatedDiagram);

    axios.put(`http://localhost:3001/api/diagrams/${id}`, sanitizedPayload, { headers })
    .then(response => {
      setDiagram(updatedDiagram);
      setEditMode(false);
      setSelectedBone("");
      setSelectedBoneData(null);
      console.log('Bone updated successfully');
    })
    .catch(err => {
      console.error('Update failed:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        alert('Failed to update bone. Please try again.');
      }
    });
  };

  const deleteBone = () => {
    if (!diagram || !selectedBone) return;

    if (window.confirm('Are you sure you want to delete this bone and all its children?')) {
      const updatedRoots = findAndDeleteBone(diagram.roots, selectedBone);
      const updatedDiagram = { ...diagram, roots: updatedRoots };

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const sanitizedPayload = sanitizeDiagramForUpdate(updatedDiagram);

      axios.put(`http://localhost:3001/api/diagrams/${id}`, sanitizedPayload, { headers })
      .then(() => {
        setDiagram(updatedDiagram);
        setEditMode(false);
        setSelectedBone("");
        setSelectedBoneData(null);
      })
      .catch(err => {
        console.error('Delete failed:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          alert('Failed to delete bone. Please try again.');
        }
      });
    }
  };

  const addRootBone = (categoryNameOrEvent?: string | React.MouseEvent) => {
    if (!diagram) return;

    let categoryName = "New Category";
    if (typeof categoryNameOrEvent === 'string') {
      categoryName = categoryNameOrEvent;
    }

    const newBone: Bone = {
      label: categoryName,
      info: "",
      metadata: "",
      children: []
    };

    const updatedRoots = [...diagram.roots, newBone];
    const updatedDiagram = { ...diagram, roots: updatedRoots };

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const sanitizedPayload = sanitizeDiagramForUpdate(updatedDiagram);

    axios.put(`http://localhost:3001/api/diagrams/${id}`, sanitizedPayload, { headers })
    .then(response => {
      setDiagram(updatedDiagram);
      console.log('Root bone added successfully');
    })
    .catch(err => {
      console.error('Add root bone failed:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        alert('Failed to add main category. Please try again.');
      }
    });
  };

  const addCommonCategory = (categoryName: string) => {
    addRootBone(categoryName);
  };

  const addChildBone = () => {
    if (!diagram || !selectedBoneData || !selectedBone) {
      alert('Please select a bone first to add a child to it.');
      return;
    }

    if (!editMode) {
      alert('Please enable Edit Mode first.');
      return;
    }

    const newChild: Bone = {
      label: "New Cause",
      info: "",
      metadata: "",
      children: []
    };

    const updatedBone: Bone = {
      ...selectedBoneData,
      children: [...(selectedBoneData.children || []), newChild]
    };

    try {
      const updatedRoots = findAndUpdateBone(diagram.roots, selectedBone, updatedBone);
      const updatedDiagram = { ...diagram, roots: updatedRoots };

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const sanitizedPayload = sanitizeDiagramForUpdate(updatedDiagram);

      axios.put(`http://localhost:3001/api/diagrams/${id}`, sanitizedPayload, { headers })
      .then(response => {
        setDiagram(updatedDiagram);
        const updatedSelectedBone = findBoneByPath(updatedRoots, selectedBone);
        setSelectedBoneData(updatedSelectedBone);

        const childCount = (updatedSelectedBone?.children?.length || 0);
        setSuccessMessage(`Child bone added! "${updatedSelectedBone?.label}" now has ${childCount} child bone${childCount !== 1 ? 's' : ''}.`);
      })
      .catch(err => {
        console.error('Add child failed:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          alert('Failed to add child bone. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error in findAndUpdateBone:', error);
      alert('Failed to add child bone. Please check your connection and try again.');
    }
  };  const exportSVG = () => {
    const svgElement = document.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${diagram?.name || 'fishbone'}.svg`;
      link.click();

      URL.revokeObjectURL(url);
    }
  };

  const saveAsPNG = () => {
    const svgElement = document.querySelector('svg');
    if (svgElement) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = 1000;
      canvas.height = 600;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = pngUrl;
            link.download = `${diagram?.name || 'fishbone'}.png`;
            link.click();
            URL.revokeObjectURL(pngUrl);
          }
        });
        URL.revokeObjectURL(url);
      };

      img.src = url;
    }
  };

  const saveAsJSON = () => {
    if (diagram) {
      const dataStr = JSON.stringify(diagram, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${diagram.name || 'fishbone'}.json`;
      link.click();

      URL.revokeObjectURL(url);
      setSuccessMessage(`📥 Diagram exported as JSON file!`);
    }
  };

  const saveDiagram = () => {
    if (!diagram) return;

    // Save the current diagram to backend
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const sanitizedPayload = sanitizeDiagramForUpdate(diagram);

    axios.put(`http://localhost:3001/api/diagrams/${id}`, sanitizedPayload, { headers })
    .then(response => {
      setSuccessMessage(`💾 Diagram "${diagram.name}" saved successfully!`);
    })
    .catch(err => {
      console.error('Save failed:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        alert('Failed to save diagram. Please try again.');
      }
    });
  };  const loadFromJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const loadedDiagram = JSON.parse(event.target?.result as string);

            // Update the backend with the loaded diagram
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const sanitizedPayload = sanitizeDiagramForUpdate(loadedDiagram);

            axios.put(`http://localhost:3001/api/diagrams/${id}`, sanitizedPayload, { headers })
            .then(() => {
              setDiagram(loadedDiagram);
              setSuccessMessage(`📤 Diagram loaded successfully from ${file.name}!`);
            })
            .catch(err => {
              console.error('Load failed:', err);
              if (err.response?.status === 401) {
                navigate('/login');
              } else {
                alert('Failed to load diagram. Please try again.');
              }
            });
          } catch (error) {
            alert('Invalid JSON file. Please select a valid fishbone diagram file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Show loading screen while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-indigo-500 border-t-indigo-600 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-xl font-semibold text-gray-700 mb-2">Loading Interactive Diagram...</p>
          <p className="text-gray-500">Preparing your workspace</p>
        </motion.div>
      </div>
    );
  }

  // Show error message if diagram not found after loading
  if (!diagram) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl font-semibold text-gray-700 mb-2">Diagram Not Found</p>
          <p className="text-gray-500 mb-6">The requested diagram could not be loaded.</p>
          <motion.button
            onClick={() => navigate('/diagrams')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Diagrams
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Main Content Area */}
      <div className={`flex-1 p-6 transition-all duration-300 ${editMode ? 'mr-96' : ''}`}>
        {/* Success Notification */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">
            <span className="text-xl">✅</span>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        <div className="max-w-full">
          {/* Compact Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {diagram.name}
                </h1>
                <p className="text-gray-600 flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Created by <span className="font-medium text-gray-700">{diagram.creator}</span>
                  {!isOwner && (
                    <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      Read-only (Not your diagram)
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Interactive Fishbone Analysis</div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  editMode ? 'bg-green-100 text-green-700' : 'bg-white/70 text-gray-600'
                }`}>
                  {editMode ? '✏️ Edit Mode Active' : '👁️ View Mode'}
                </div>
              </div>
            </div>
          </div>

          {/* Compact Controls */}
          <div className="mb-4 flex gap-2 flex-wrap items-center justify-between bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-200">
            <div className="flex gap-2">
              {isOwner && (
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    editMode
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                  }`}
                >
                  {editMode ? '🔒 Exit Edit' : '✏️ Edit'}
                </button>
              )}

              {isOwner && (
                <button
                  onClick={addRootBone}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 flex items-center gap-1 font-medium transition-all duration-200 text-sm"
                >
                  ➕ Add Category
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportSVG}
                className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs"
              >
                💾 Export
              </button>
              {isOwner && (
                <>
                  <button
                    onClick={saveDiagram}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-medium"
                  >
                    💾 Save Changes
                  </button>
                  <button
                    onClick={saveAsJSON}
                    className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-xs"
                  >
                    📄 Export JSON
                  </button>
                  <button
                    onClick={loadFromJSON}
                    className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-xs"
                  >
                    📤 Load
                  </button>
                </>
              )}
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-1 font-medium transition-all duration-200 text-sm"
              >
                ← Back
              </button>
            </div>
          </div>

          <div className="mb-4 p-3 bg-blue-900/50 border border-blue-700/50 rounded-lg">
            <p className="text-xs text-blue-300 flex items-center gap-2">
              <span>✨</span>
              <strong>Fishbone Diagram:</strong> Main categories in boxes, sub-causes as simple text labels. Click +number to expand sub-causes.
            </p>
          </div>

          {/* SVG Diagram Container - Full Viewport */}
          <div className="w-full">
            <div
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-auto"
              style={{
                height: 'calc(100vh - 280px)',
                minHeight: '500px'
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedBone("");
                  setSelectedBoneData(null);
                }
              }}
            >
              {diagram.roots.length === 0 ? (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50">
                  <div className="text-center max-w-md">
                    <div className="text-6xl mb-4 animate-pulse">🔍</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Start Your Analysis</h3>
                    <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                      Create a comprehensive fishbone diagram by adding main categories.
                    </p>

                    {/* Compact Quick Category Buttons */}
                    <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center justify-center gap-2">
                        ⚡ Quick Add Common Categories
                      </p>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {['People', 'Process', 'Technology', 'Environment', 'Materials', 'Methods'].map(category => (
                          <button
                            key={category}
                            onClick={() => addCommonCategory(category)}
                            className="px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 font-medium transition-all duration-200 border border-blue-200 hover:border-blue-300 text-xs"
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-gray-600 text-xs mb-4 flex items-center justify-center gap-2">
                      <div className="h-px bg-gray-300 flex-1"></div>
                      <span>or</span>
                      <div className="h-px bg-gray-300 flex-1"></div>
                    </div>

                    <button
                      onClick={addRootBone}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 font-semibold flex items-center gap-2 mx-auto transition-all duration-200 shadow-lg shadow-purple-200 text-sm"
                    >
                      ➕ Add Custom Category
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 h-full overflow-auto">
                  <SVGClassicFishbone
                    effectLabel={diagram.effectLabel}
                    bones={diagram.roots}
                    onBoneClick={handleBoneClick}
                    selectedBone={selectedBone}
                    expandedBones={expandedBones}
                    width={1200}
                    height={600}
                    theme="light"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR - Edit Panel */}
      {editMode && isOwner && (
        <div className="fixed top-0 right-0 h-full w-96 bg-white border-l-4 border-blue-500 shadow-2xl z-50 transition-all duration-300 overflow-y-auto">
          <div className="p-6">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">⚡</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-700">Edit Panel</h3>
                  <p className="text-xs text-gray-500">Click any bone to edit</p>
                </div>
              </div>
              <button
                onClick={() => setEditMode(false)}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                ✕ Close
              </button>
            </div>

            {selectedBoneData ? (
              <div className="space-y-6">
                {/* Status indicator */}
                <div className="px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded-lg font-medium border border-blue-200">
                  Editing: {selectedBoneData.label}
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Basic Information
                  </h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Label *</label>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Enter bone label"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as 'resolved' | 'issue' | 'pending' | '')}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">No Status</option>
                      <option value="resolved">✅ Resolved (Green)</option>
                      <option value="issue">❌ Issue (Red)</option>
                      <option value="pending">⏳ Pending (Orange)</option>
                    </select>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Additional Details
                  </h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Information</label>
                    <textarea
                      value={editInfo}
                      onChange={(e) => setEditInfo(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      rows={2}
                      placeholder="Additional details"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Metadata</label>
                    <input
                      type="text"
                      value={editMetadata}
                      onChange={(e) => setEditMetadata(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Tags, notes, categories"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Actions
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={updateBone}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2 font-medium transition-all text-sm"
                    >
                      💾 Update Bone
                    </button>
                    <button
                      onClick={addChildBone}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-3 rounded-lg hover:from-green-600 hover:to-green-700 flex items-center justify-center gap-2 font-medium transition-all text-sm"
                    >
                      ➕ Add Sub-Cause
                    </button>
                    <button
                      onClick={deleteBone}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-3 rounded-lg hover:from-red-600 hover:to-red-700 flex items-center justify-center gap-2 font-medium transition-all text-sm"
                    >
                      🗑️ Delete Bone
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBone("");
                        setSelectedBoneData(null);
                      }}
                      className="w-full bg-gray-100 text-gray-600 py-2 px-3 rounded-lg hover:bg-gray-200 font-medium transition-all text-sm"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quick Add Categories */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Quick Add Categories
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['People', 'Process', 'Technology', 'Environment', 'Materials', 'Methods'].map(category => (
                      <button
                        key={category}
                        onClick={() => addCommonCategory(category)}
                        className="px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 font-medium transition-all duration-200 border border-blue-200 hover:border-blue-300 text-xs"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Instructions
                  </h4>
                  <div className="text-xs text-gray-600 space-y-2">
                    <p>• Click any bone in the diagram to edit it</p>
                    <p>• Use "Add Category" to create main categories</p>
                    <p>• Add sub-causes by selecting a bone first</p>
                    <p>• Click +number indicators to expand collapsed bones</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
