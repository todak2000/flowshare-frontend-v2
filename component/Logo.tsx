import { Droplet } from "lucide-react";

export const Logo = () => (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-lg flex items-center justify-center">
          <Droplet className="w-6 h-6 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        FlowShare
      </span>
    </div>
  );