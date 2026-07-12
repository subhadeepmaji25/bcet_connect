import { Globe2, Users, Building2, UserCircle } from "lucide-react";

export const VisibilityBadge = ({ visibility, section }) => {
  const configs = {
    public: { color: "text-blue-400 bg-blue-400/10", icon: Globe2, label: "Public" },
    department: { color: "text-purple-400 bg-purple-400/10", icon: Building2, label: "Department" },
    semester: { color: "text-orange-400 bg-orange-400/10", icon: Users, label: "Semester" },
    section: { color: "text-indigo-400 bg-indigo-400/10", icon: UserCircle, label: `Section ${section || ''}` },
  };

  const config = configs[visibility?.toLowerCase()] || configs.public;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>
      <Icon size={10} />
      {config.label}
    </span>
  );
};
