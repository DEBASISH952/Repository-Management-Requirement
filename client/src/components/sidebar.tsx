import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Upload, 
  Star, 
  Clock, 
  Settings, 
  Grid3X3 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  onUploadClick: () => void;
  filters: {
    category: string;
    assetType: string;
    region: string;
    startDate: string;
    endDate: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ 
  onUploadClick, 
  filters, 
  onFilterChange, 
  onClearFilters,
  activeView,
  onViewChange 
}: SidebarProps) {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Provide default values for stats
  const statsData = stats || { totalAssets: 0, thisMonth: 0, pendingReview: 0 };

  const navigationItems = [
    { id: "all", label: "All Assets", icon: Grid3X3 },
    { id: "recent", label: "Recent Uploads", icon: Upload },
    { id: "favorites", label: "Favorites", icon: Star },
    { id: "versions", label: "Version History", icon: Clock },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-80 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        {/* Upload Section */}
        <div className="mb-8">
          <Button 
            onClick={onUploadClick}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Assets</span>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Quick Stats
          </h3>
          <div className="space-y-3">
            <Card>
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-primary">
                  {statsData.totalAssets}
                </div>
                <div className="text-sm text-gray-600">Total Assets</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-green-600">
                  {statsData.thisMonth}
                </div>
                <div className="text-sm text-gray-600">This Month</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-yellow-600">
                  {statsData.pendingReview}
                </div>
                <div className="text-sm text-gray-600">Pending Review</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Filters
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </Label>
              <Select value={filters.category} onValueChange={(value) => onFilterChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Brand">Brand</SelectItem>
                  <SelectItem value="Tactical">Tactical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Asset Type
              </Label>
              <Select value={filters.assetType} onValueChange={(value) => onFilterChange("assetType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Static">Static</SelectItem>
                  <SelectItem value="Carousel">Carousel</SelectItem>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="Emailer">Emailer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => onFilterChange("startDate", e.target.value)}
                />
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => onFilterChange("endDate", e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </Label>
              <Select value={filters.region} onValueChange={(value) => onFilterChange("region", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="North">North</SelectItem>
                  <SelectItem value="South">South</SelectItem>
                  <SelectItem value="East">East</SelectItem>
                  <SelectItem value="West">West</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={onClearFilters}
              variant="outline" 
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Navigation
          </h3>
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`sidebar-item flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium w-full text-left ${
                    activeView === item.id 
                      ? "active bg-blue-50 text-blue-600 border-r-2 border-blue-600" 
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
