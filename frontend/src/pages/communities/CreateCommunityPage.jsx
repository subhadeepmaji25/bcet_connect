// src/pages/communities/CreateCommunityPage.jsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Globe, ShieldAlert, Plus, Trash2, BookOpen } from "lucide-react";
import { createCommunity } from "../../api/community.api";
import toast from "react-hot-toast";

const ALL_CATEGORIES = [
  "technology", "career", "academic", "hobby", "sports",
  "arts", "entrepreneurship", "social-cause", "other"
];

export default function CreateCommunityPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "technology",
    visibility: "public"
  });

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [rules, setRules] = useState([]);
  const [ruleInput, setRuleInput] = useState("");

  const createMut = useMutation({
    mutationFn: createCommunity,
    onSuccess: (res) => {
      const community = res?.data?.community || res?.data || {};
      toast.success("Community created successfully!");
      if (community._id) {
        navigate(`/communities/${community._id}`);
      } else {
        navigate("/communities");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create community");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      return toast.error("Community name must contain at least 3 characters");
    }

    createMut.mutate({
      ...formData,
      tags,
      rules
    });
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return toast.error("Tag already exists");
    if (tags.length >= 10) return toast.error("Maximum 10 tags allowed");
    setTags([...tags, trimmed]);
    setTagInput("");
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const addRule = () => {
    const trimmed = ruleInput.trim();
    if (!trimmed) return;
    if (rules.length >= 15) return toast.error("Maximum 15 rules allowed");
    setRules([...rules, trimmed]);
    setRuleInput("");
  };

  const removeRule = (indexToRemove) => {
    setRules(rules.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        to="/communities"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Discover
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-black text-slate-900 tracking-tight">Create Community</h1>
        <p className="text-slate-500 text-sm mt-1">Set up a space for your study groups, tech clubs, or interests.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Community Name</label>
            <input
              type="text"
              required
              maxLength={60}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Durgapur Web Developers"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              rows={4}
              maxLength={500}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this community about? Share tags, goals, or schedule."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Category & Visibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none cursor-pointer"
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visibility</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: "public" })}
                  className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${
                    formData.visibility === "public"
                      ? "border-indigo-400 bg-indigo-50/50 text-indigo-700 font-bold"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <Globe className="w-5 h-5 mb-1 text-indigo-500" />
                  <span className="text-xs">Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: "private" })}
                  className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${
                    formData.visibility === "private"
                      ? "border-indigo-400 bg-indigo-50/50 text-indigo-700 font-bold"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <ShieldAlert className="w-5 h-5 mb-1 text-amber-500" />
                  <span className="text-xs">Private</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tags Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tags (Max 10)</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="e.g. react, dsa, career"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
            />
            <button
              type="button"
              onClick={addTag}
              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors shrink-0"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1.5 rounded-lg"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(idx)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Rules Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Community Rules (Max 15)</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={ruleInput}
              onChange={(e) => setRuleInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRule())}
              placeholder="e.g. Be respectful and help others learn."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
            />
            <button
              type="button"
              onClick={addRule}
              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors shrink-0"
            >
              Add
            </button>
          </div>
          {rules.length > 0 && (
            <div className="space-y-2 pt-2">
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl"
                >
                  <p className="text-xs font-semibold text-slate-700 flex gap-2">
                    <span className="font-black text-indigo-600">{idx + 1}.</span>
                    {rule}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeRule(idx)}
                    className="text-slate-400 hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={createMut.isPending}
          className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/15"
        >
          <Save className="w-5 h-5 text-white" />
          {createMut.isPending ? "Creating..." : "Save and Create"}
        </button>
      </form>
    </div>
  );
}
