import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { getCommunityById, getMyMembership } from "../../api/community.api";
import { hasPermission } from "../../constants/communityPermissions";

// Components
import CommunityHeader from "../../components/communities/layout/CommunityHeader";
import CommunityTabs from "../../components/communities/layout/CommunityTabs";
import CommunityFeedTab from "../../components/communities/feed/CommunityFeedTab";
import CommunityChatTab from "../../components/communities/chat/CommunityChatTab";
import CommunityMembersTab from "../../components/communities/members/CommunityMembersTab";
import CommunityAboutTab from "../../components/communities/about/CommunityAboutTab";
import CommunityRequestsTab from "../../components/communities/requests/CommunityRequestsTab";

export default function CommunityDetailPage() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("feed");

  // Fetch Community basic details
  const { data: communityData, isPending: isCommPending, error: commError } = useQuery({
    queryKey: ["community", communityId],
    queryFn: () => getCommunityById(communityId)
  });

  // Fetch Viewer membership status
  const { data: membershipData } = useQuery({
    queryKey: ["community-membership", communityId],
    queryFn: () => getMyMembership(communityId).catch(() => ({ data: null }))
  });

  if (isCommPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (commError) {
    return (
      <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl max-w-md mx-auto shadow-sm mt-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Community Not Found</h3>
        <p className="text-slate-500 text-xs mt-1 mb-6">This community doesn't exist or you don't have permission to view it.</p>
        <Link to="/communities" className="bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl">
          Back to Communities
        </Link>
      </div>
    );
  }

  const community = communityData?.data?.community || communityData?.data || {};
  const membership = membershipData?.data?.membership || membershipData?.data || null;
  const role = membership?.role || null;
  const isMuted = membership?.isMuted || false;

  const showRequestsTab = hasPermission(role, "approve_join_request");
  const isPrivate = community.visibility === "private";
  const isMember = !!membership;

  return (
    <div className="space-y-6">
      <Link
        to="/communities"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Discover
      </Link>

      <CommunityHeader
        community={community}
        membership={membership}
        role={role}
        isMember={isMember}
        communityId={communityId}
      />

      <CommunityTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMember={isMember}
        showRequestsTab={showRequestsTab}
      />

      <div className="space-y-6">
        {activeTab === "feed" && (
          <CommunityFeedTab
            communityId={communityId}
            isMember={isMember}
            isMuted={isMuted}
            role={role}
            isPrivate={isPrivate}
            community={community}
          />
        )}
        
        {activeTab === "chat" && (
          <CommunityChatTab
            conversationId={community.conversationId}
            isMuted={isMuted}
          />
        )}

        {activeTab === "members" && (
          <CommunityMembersTab
            communityId={communityId}
            role={role}
          />
        )}

        {activeTab === "about" && (
          <CommunityAboutTab
            community={community}
            role={role}
          />
        )}

        {activeTab === "requests" && (
          <CommunityRequestsTab
            communityId={communityId}
          />
        )}
      </div>
    </div>
  );
}
