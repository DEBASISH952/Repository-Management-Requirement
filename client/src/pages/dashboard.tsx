import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { AssetGrid } from "@/components/asset-grid";
import { UploadModal } from "@/components/upload-modal";
import { AssetPreviewModal } from "@/components/asset-preview-modal";
import { Grid3X3, List, FileSpreadsheet, ListTodo } from "lucide-react";
import { Asset } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    assetType: "all", 
    region: "all",
    startDate: "",
    endDate: ""
  });
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState("grid");
  const [activeView, setActiveView] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const limit = 20;

  // Fetch assets
  const { data: assetsData, isLoading } = useQuery({
    queryKey: ["/api/assets", filters, searchQuery, currentPage, sortBy, activeView],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...filters,
        search: searchQuery,
        limit: limit.toString(),
        offset: (currentPage * limit).toString(),
        sort: sortBy
      });

      // Remove empty filters and handle "all" values
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (!value || value === "all") {
          params.delete(key);
        }
      });

      if (!searchQuery) params.delete('search');

      const response = await fetch(`/api/assets?${params}`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      return response.json();
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/assets/${id}/favorite`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      category: "all",
      assetType: "all",
      region: "all", 
      startDate: "",
      endDate: ""
    });
    setSearchQuery("");
    setCurrentPage(0);
  };

  const handlePreviewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsPreviewModalOpen(true);
  };

  const handleDownloadAsset = (asset: Asset) => {
    window.open(asset.driveLink, '_blank');
  };

  const handleToggleFavorite = (asset: Asset) => {
    toggleFavoriteMutation.mutate(asset.id);
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/assets/export/excel');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assets-export.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: "Assets exported to Excel successfully."
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export assets to Excel.",
        variant: "destructive"
      });
    }
  };

  const assets = assetsData?.assets || [];
  const totalCount = assetsData?.totalCount || 0;
  const hasMore = assetsData?.hasMore || false;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <div className="flex h-screen pt-0">
        <Sidebar
          onUploadClick={() => setIsUploadModalOpen(true)}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        
        <main className="flex-1 overflow-y-auto">
          {/* Action Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">Digital Assets</h2>
                <span className="text-sm text-gray-500">
                  {totalCount} asset{totalCount !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="px-3 py-1"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="px-3 py-1"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="size">Sort by Size</SelectItem>
                    <SelectItem value="type">Sort by Type</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Bulk Actions */}
                <Button 
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Feature coming soon",
                      description: "Bulk actions will be available in a future update."
                    });
                  }}
                >
                  <ListTodo className="mr-2 h-4 w-4" />
                  Bulk Actions
                </Button>
                
                {/* Export Button */}
                <Button 
                  onClick={handleExportExcel}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              </div>
            </div>
          </div>

          {/* Assets Grid */}
          <div className="p-6">
            <AssetGrid
              assets={assets}
              onPreview={handlePreviewAsset}
              onDownload={handleDownloadAsset}
              onToggleFavorite={handleToggleFavorite}
              isLoading={isLoading}
            />

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium">{currentPage * limit + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min((currentPage + 1) * limit, totalCount)}
                  </span>{" "}
                  of <span className="font-medium">{totalCount}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, Math.ceil(totalCount / limit)) }, (_, i) => {
                    const pageNum = currentPage < 3 ? i : currentPage - 2 + i;
                    if (pageNum >= Math.ceil(totalCount / limit)) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!hasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      <AssetPreviewModal
        asset={selectedAsset}
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setSelectedAsset(null);
        }}
      />
    </div>
  );
}
