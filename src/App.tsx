import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import CompanionProfile from "./pages/CompanionProfile";
import Gallery from "./pages/Gallery";
import Community from "./pages/Community";
import CommunityPost from "./pages/CommunityPost";
import RelationshipStats from "./pages/RelationshipStats";
import NotFound from "./pages/NotFound";
import UserProfile from "./pages/UserProfile";
import AdminModeration from "./pages/AdminModeration";
import AdminUsers from "./pages/AdminUsers";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminConversation from "./pages/AdminConversation";
import AdminStats from "./pages/AdminStats";
import AdminModels from "./pages/AdminModels";
import AdminWallpapers from "./pages/AdminWallpapers";
import ProtectedRoute from "./components/ProtectedRoute";
import AppWallpaper from "./components/AppWallpaper";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chat/:companionId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/companion/:companionId" element={<ProtectedRoute><CompanionProfile /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/community/:postId" element={<ProtectedRoute><CommunityPost /></ProtectedRoute>} />
          <Route path="/stats/:companionId" element={<ProtectedRoute><RelationshipStats /></ProtectedRoute>} />
          <Route path="/u/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/admin/moderation" element={<ProtectedRoute><AdminModeration /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/users/:userId" element={<ProtectedRoute><AdminUserDetail /></ProtectedRoute>} />
          <Route path="/admin/conversations/:conversationId" element={<ProtectedRoute><AdminConversation /></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute><AdminStats /></ProtectedRoute>} />
          <Route path="/admin/models" element={<ProtectedRoute><AdminModels /></ProtectedRoute>} />
          <Route path="/admin/wallpapers" element={<ProtectedRoute><AdminWallpapers /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
