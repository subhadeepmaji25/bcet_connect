import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, ArrowLeft, GripVertical, Save, Map } from "lucide-react";
import { useCreatePath } from "../../hooks/useLearningPaths";
import { useMySubjects } from "../../hooks/useSubjects";
import toast from "react-hot-toast";

export const FacultyPathBuilderPage = () => {
  const navigate = useNavigate();
  const { data: subjectsData, isLoading: loadingSubjects } = useMySubjects();
  const { mutate: createPath, isPending } = useCreatePath();
  
  const subjects = subjectsData?.data?.subjects || [];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectId: "",
    difficulty: "beginner",
    estimatedTimeMinutes: "",
    visibility: "public"
  });

  const [nodes, setNodes] = useState([]);
  const [newNode, setNewNode] = useState({ title: "", description: "", resourceId: "" });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddNode = () => {
    if (!newNode.title.trim()) {
      toast.error("Node title is required");
      return;
    }
    
    // Auto-increment order
    const order = nodes.length + 1;
    
    setNodes([...nodes, { ...newNode, order }]);
    setNewNode({ title: "", description: "", resourceId: "" });
  };

  const handleRemoveNode = (index) => {
    const newNodes = nodes.filter((_, i) => i !== index);
    // Re-assign orders
    const reordered = newNodes.map((n, i) => ({ ...n, order: i + 1 }));
    setNodes(reordered);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nodes.length === 0) {
      toast.error("Please add at least one node to the path");
      return;
    }
    
    // In a real app we'd validate the resources and maybe search for them,
    // but here we are sending the text inputs
    const payload = {
      ...formData,
      nodes: nodes.map(n => ({
        title: n.title,
        description: n.description,
        order: n.order,
        // resourceId: if they entered a valid MongoId we'd map it, for demo we send what we have
        ...(n.resourceId ? { resourceId: n.resourceId } : {})
      }))
    };

    createPath(payload, {
      onSuccess: () => {
        toast.success("Learning path created successfully!");
        navigate("/learning/paths");
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Map className="text-emerald-400" />
          Build Learning Path
        </h1>
        <p className="text-slate-400">Create a structured sequence of resources for your students.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Details */}
        <div className="bg-[#1a1a2e] border border-white/5 rounded-xl p-6 lg:p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">Path Details</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Path Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Complete Web Development 101"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Subject *</label>
                <select
                  name="subjectId"
                  required
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select a subject...</option>
                  {subjects.map(sub => (
                    <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Difficulty</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                placeholder="What will students learn in this path?"
              />
            </div>
          </div>
        </div>

        {/* Nodes Builder */}
        <div className="bg-[#1a1a2e] border border-white/5 rounded-xl p-6 lg:p-8 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Path Nodes (Steps)</h2>
            <span className="text-sm text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              {nodes.length} Nodes
            </span>
          </div>
          
          {nodes.length > 0 && (
            <div className="space-y-3 mb-8">
              {nodes.map((node, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-[#0f0f1a] border border-white/10 rounded-lg">
                  <div className="mt-1 text-slate-500 cursor-move">
                    <GripVertical size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-emerald-400 font-bold text-sm">Step {node.order}:</span>
                      <h4 className="text-white font-semibold">{node.title}</h4>
                    </div>
                    {node.description && <p className="text-slate-400 text-sm mb-2">{node.description}</p>}
                    {node.resourceId && <p className="text-xs text-indigo-400 bg-indigo-500/10 inline-block px-2 py-0.5 rounded">Resource ID attached</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveNode(index)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Node Form */}
          <div className="p-5 border border-emerald-500/30 bg-emerald-500/5 rounded-lg border-dashed">
            <h3 className="text-sm font-semibold text-emerald-400 mb-4 uppercase tracking-wider">Add New Step</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="col-span-1 md:col-span-2">
                <input
                  type="text"
                  value={newNode.title}
                  onChange={(e) => setNewNode({...newNode, title: e.target.value})}
                  placeholder="Step Title *"
                  className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <textarea
                  value={newNode.description}
                  onChange={(e) => setNewNode({...newNode, description: e.target.value})}
                  rows={2}
                  placeholder="Step Description (Optional)"
                  className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <input
                  type="text"
                  value={newNode.resourceId}
                  onChange={(e) => setNewNode({...newNode, resourceId: e.target.value})}
                  placeholder="Attach Resource ID (Optional)"
                  className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-slate-500 mt-1">In a full version, this would be a search dropdown for existing resources.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddNode}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 py-2 rounded-lg transition-colors"
            >
              <Plus size={18} />
              Add Step to Path
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/learning")}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || nodes.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors font-medium disabled:opacity-50"
          >
            <Save size={18} />
            {isPending ? "Saving..." : "Save Learning Path"}
          </button>
        </div>
      </form>
    </div>
  );
};
