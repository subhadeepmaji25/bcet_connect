import { Routes, Route } from "react-router-dom";
// Pages
import { MyUploadsPage } from "./pages/shared/MyUploadsPage";
import { LearningHubPage } from "./pages/shared/LearningHubPage";
import { ResourcesBrowsePage } from "./pages/shared/ResourcesBrowsePage";
import { ResourceDetailPage } from "./pages/shared/ResourceDetailPage";
import { PathsBrowsePage } from "./pages/shared/PathsBrowsePage";
import { PathDetailPage } from "./pages/shared/PathDetailPage";
import { PendingVerificationPage } from "./pages/faculty/PendingVerificationPage";
import { FacultyPathBuilderPage } from "./pages/faculty/FacultyPathBuilderPage";
import { ResourceUploadForm } from "./components/resource/ResourceUploadForm";

// For demo purposes and until all pages are built, we'll route to placeholders or the components we have.
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center h-64 text-slate-400">
    <h2 className="text-2xl font-bold">{title} Page - Coming Soon</h2>
  </div>
);

export const LearningRoutes = () => {
  return (
    <Routes>
      {/* Student/General Routes */}
      <Route path="/" element={<LearningHubPage />} />
      <Route path="/resources" element={<ResourcesBrowsePage />} />
      <Route path="/resources/upload" element={<div className="max-w-3xl mx-auto p-4 md:p-8"><ResourceUploadForm /></div>} />
      <Route path="/resources/:id" element={<ResourceDetailPage />} />
      <Route path="/subjects/:id" element={<PlaceholderPage title="Subject Detail" />} />
      
      {/* Shared Routes */}
      <Route path="/my-uploads" element={<MyUploadsPage />} />
      <Route path="/bookmarks" element={<PlaceholderPage title="My Bookmarks" />} />
      <Route path="/stats" element={<PlaceholderPage title="My Learning Stats" />} />
      
      {/* Path Routes */}
      <Route path="/paths" element={<PathsBrowsePage />} />
      <Route path="/paths/:id" element={<PathDetailPage />} />
      
      {/* Faculty Routes */}
      <Route path="/manage/subjects" element={<PlaceholderPage title="Manage Subjects" />} />
      <Route path="/manage/verification" element={<PendingVerificationPage />} />
      <Route path="/manage/paths/build" element={<FacultyPathBuilderPage />} />
      <Route path="/manage/overview" element={<PlaceholderPage title="Faculty Overview" />} />
    </Routes>
  );
};

export default LearningRoutes;
