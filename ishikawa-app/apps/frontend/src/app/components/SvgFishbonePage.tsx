import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import SVGClassicFishbone from "./SVGClassicFishbone";

interface Bone {
  label: string;
  info?: string;
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

export default function SvgFishbonePage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hardcoded diagram data
    // const hardcodedDiagram: Diagram = {
    //   "id": "sample-1",
    //   "name": "Production Delay Root Cause",
    //   "creator": "aburht",
    //   "effectLabel": "Production Delay",
    //   "effectInfo": "Final Effect",
    //   "roots": [
    //     {
    //       "label": "People",
    //       "info": "Staff related",
    //       "metadata": "",
    //       "children": [

    //       ]
    //     },
    //     {
    //       "label": "Process",
    //       "info": "",
    //       "metadata": "",
    //       "children": [
    //       ]
    //     },
    //     {
    //       "label": "Machine",
    //       "info": "",
    //       "metadata": "",
    //       "children": [
    //         {
    //           "label": "Frequent Breakdowns",
    //           "info": "",
    //           "metadata": "",
    //           "children": [
    //             {
    //               "label": "Lack of Maintenance",
    //               "info": "",
    //               "metadata": "",
    //               "children": []
    //             }
    //           ]
    //         }
    //       ]
    //     }
    //   ]
    // };

    // // Set the hardcoded diagram instead of fetching
    // setDiagram(hardcodedDiagram);

    // Original fetch code commented out:

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios.get(`http://localhost:3001/api/diagrams/${id}`, { headers })
      .then(response => {
        setDiagram(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch diagram:', err);
        setDiagram(null);
        setLoading(false);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      });

  }, [id, token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-600">Loading diagram...</p>
        </div>
      </div>
    );
  }

  if (!diagram) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Diagram Not Found</h2>
          <p className="text-gray-600 mb-4">The diagram you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {diagram.name}
              </h1>
              <p className="text-gray-600 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Created by <span className="font-medium text-gray-700">{diagram.creator}</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  👁️ Read-only View
                </span>
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-1 font-medium transition-all duration-200 text-sm"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="p-3 bg-blue-900/50 border border-blue-700/50 rounded-lg mb-4">
          <p className="text-xs text-blue-300 flex items-center gap-2">
            <span>✨</span>
            <strong>Fishbone Diagram:</strong> Main categories in boxes, sub-causes as simple text labels. This is a read-only view.
          </p>
        </div>

        {/* SVG Diagram Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-auto" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
          <div className="p-4 h-full overflow-auto">
            <SVGClassicFishbone
              effectLabel={diagram.effectLabel}
              bones={diagram.roots}
              width={1200}
              height={600}
              theme="light"
            />
          </div>
        </div>
      </div>
    </div>
  );
}