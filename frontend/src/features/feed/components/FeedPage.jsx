import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CreatePostBox from "./CreatePostBox";
import PostList from "./PostList";
import { Activity, Sparkles, Users, Pin, Megaphone, Bookmark, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { feedApi } from "../../../api/feedApi";
import toast from "react-hot-toast";

const FILTERS = [
  { key: "all", label: "All", icon: Activity },
  { key: "recommended", label: "Recommended", icon: Sparkles },
  { key: "connections", label: "Connections", icon: Users },
  { key: "pinned", label: "Pinned", icon: Pin },
  { key: "announcements", label: "Announcements", icon: Megaphone },
  { key: "saved", label: "Saved", icon: Bookmark }
];

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const { user } = useAuth();
  const isAdmin = ["admin"].includes(user?.role);
  const reportsQuery = useQuery({
    queryKey: ["feed-reports"],
    queryFn: () => feedApi.getReports({ status: "pending", limit: 10 }),
    enabled: isAdmin
  });

  const resolveReport = async (reportId, action) => {
    try {
      await feedApi.resolveReport(reportId, { status: "resolved", action, resolutionNote: "" });
      toast.success("Report resolved");
      reportsQuery.refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to resolve report");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,91,255,0.08),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)]">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-0">
        <div className="mb-6 rounded-[28px] border border-slate-200 bg-white/90 backdrop-blur-xl shadow-[0_12px_40px_rgba(15,23,42,0.06)] p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#635BFF] mb-2">Social feed</p>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Your Feed</h1>
              <p className="text-slate-500 text-sm font-medium max-w-2xl">
                Career posts, community updates, recommendations, and announcements in one place.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
              <div className="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200">Create post</div>
              <div className="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200">Like & react</div>
              <div className="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200">Bookmark</div>
              <div className="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200">Report</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {FILTERS.map((filter) => {
            const Icon = filter.icon;
            const active = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
                  active
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
        </div>

        <CreatePostBox />

        <div className="mt-6 relative">
          <PostList
            scope={activeFilter}
            filters={{
              feedScope: activeFilter
            }}
          />
        </div>

        {isAdmin && (
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-extrabold text-slate-900">Feed Moderation Queue</h2>
            </div>
            {reportsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading reports...</p>
            ) : (reportsQuery.data?.data?.reports || []).length === 0 ? (
              <p className="text-sm text-slate-500">No pending reports right now.</p>
            ) : (
              <div className="space-y-3">
                {reportsQuery.data.data.reports.map((report) => (
                  <div key={report._id} className="rounded-2xl border border-slate-200 p-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900 capitalize">{report.targetType} reported for {report.reason}</p>
                      <p className="text-xs text-slate-500 mt-1">By {report.reporterId?.username || "Unknown"}</p>
                      <p className="text-xs text-slate-400 mt-1">{report.note || "No note provided"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => resolveReport(report._id, "none")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Dismiss
                      </button>
                      <button
                        onClick={() => resolveReport(report._id, "hide")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
                      >
                        <XCircle className="w-4 h-4" /> Hide
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
