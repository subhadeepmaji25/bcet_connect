import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateCommunity } from "../../../api/community.api";

export default function CommunityAboutTab({ community, role }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(community.description || "");
  const [visibility, setVisibility] = useState(community.visibility || "public");
  const [rules, setRules] = useState(community.rules || []);
  const [ruleInput, setRuleInput] = useState("");

  const updateMut = useMutation({
    mutationFn: (data) => updateCommunity(community._id, data),
    onSuccess: () => {
      toast.success("Community details updated");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['community', community._id] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update");
    }
  });

  const handleUpdate = (e) => {
    e.preventDefault();
    updateMut.mutate({ description, rules, visibility });
  };

  const addRule = () => {
    if (!ruleInput.trim()) return;
    setRules([...rules, ruleInput.trim()]);
    setRuleInput("");
  };

  const deleteRule = (idx) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  const isLeader = ["owner", "leader"].includes(role);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-6">
        {editing ? (
          <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
            <h3 className="font-display font-black text-slate-900 text-lg">Edit Details</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Visibility</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${visibility === 'public' ? 'border-indigo-600 bg-indigo-50/50 shadow-sm shadow-indigo-600/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <input type="radio" name="visibility" value="public" checked={visibility === "public"} onChange={(e) => setVisibility(e.target.value)} className="w-4 h-4 text-indigo-600 accent-indigo-600 cursor-pointer" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Public</p>
                      <p className="text-[10px] font-semibold text-slate-500">Anyone can find and join.</p>
                    </div>
                  </label>
                  <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${visibility === 'private' ? 'border-indigo-600 bg-indigo-50/50 shadow-sm shadow-indigo-600/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <input type="radio" name="visibility" value="private" checked={visibility === "private"} onChange={(e) => setVisibility(e.target.value)} className="w-4 h-4 text-indigo-600 accent-indigo-600 cursor-pointer" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Private</p>
                      <p className="text-[10px] font-semibold text-slate-500">Requires leader approval to join.</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rules List</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ruleInput}
                  onChange={(e) => setRuleInput(e.target.value)}
                  placeholder="Add a new rule..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={addRule}
                  className="bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Add
                </button>
              </div>

              {rules.length > 0 && (
                <div className="space-y-2 pt-2">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <span>{idx + 1}. {rule}</span>
                      <button type="button" onClick={() => deleteRule(idx)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={updateMut.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                {updateMut.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setDescription(community.description || ""); setVisibility(community.visibility || "public"); setRules(community.rules || []); }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <h3 className="font-display font-black text-slate-900 text-lg">About Community</h3>
              {isLeader && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit About
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</h4>
                <p className="text-slate-700 text-sm font-medium leading-relaxed">{community.description || "No description provided."}</p>
              </div>

              {community.tags?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Topic Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {community.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {rules.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Community Rules</h4>
                  <div className="space-y-2">
                    {rules.map((rule, idx) => (
                      <div key={idx} className="flex gap-2.5 text-xs text-slate-700 font-semibold leading-relaxed">
                        <span className="font-black text-indigo-600">{idx + 1}.</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata</h4>
        <div className="space-y-2.5 text-xs font-semibold text-slate-600">
          <p>Created: {new Date(community.createdAt).toLocaleDateString()}</p>
          <p>Visibility: <span className="capitalize">{community.visibility}</span></p>
          <p>Category: <span className="capitalize">{community.category}</span></p>
        </div>
      </div>
    </div>
  );
}
