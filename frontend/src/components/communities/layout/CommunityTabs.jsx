import { MessageSquare, Users, Shield, Star, FileText } from "lucide-react";

export default function CommunityTabs({ activeTab, setActiveTab, isMember, showRequestsTab }) {
  const tabs = [
    { id: "feed", label: "Community Feed", icon: FileText, show: true },
    { id: "chat", label: "Group Chat", icon: MessageSquare, show: isMember },
    { id: "members", label: "Members", icon: Users, show: isMember },
    { id: "about", label: "About", icon: Star, show: true },
    { id: "requests", label: "Join Requests", icon: Shield, show: isMember && showRequestsTab }
  ].filter(t => t.show);

  return (
    <div className="bg-white rounded-2xl p-2 border border-slate-100 shadow-sm flex flex-wrap gap-1.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeTab === t.id
              ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm"
              : "bg-transparent text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <t.icon className="w-4 h-4" /> {t.label}
        </button>
      ))}
    </div>
  );
}
