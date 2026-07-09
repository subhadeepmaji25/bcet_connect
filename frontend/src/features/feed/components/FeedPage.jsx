import CreatePostBox from "./CreatePostBox";
import PostList from "./PostList";

export default function FeedPage() {
  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Your Feed</h1>
        <p className="text-slate-500 text-sm font-medium">See what's happening in your network</p>
      </div>
      
      <CreatePostBox />
      
      <div className="mt-8 relative before:absolute before:inset-0 before:-z-10 before:bg-slate-50 before:rounded-3xl before:shadow-inner p-4 sm:p-6 -mx-4 sm:mx-0">
        <PostList />
      </div>
    </div>
  );
}
