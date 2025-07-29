import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Download, 
  Heart, 
  Edit, 
  Copy, 
  Trash2,
  ExternalLink
} from "lucide-react";
import { Asset } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AssetPreviewModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AssetPreviewModal({ asset, isOpen, onClose }: AssetPreviewModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/assets/${id}/favorite`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Updated",
        description: asset?.isFavorite ? "Removed from favorites" : "Added to favorites"
      });
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Asset deleted",
        description: "Asset has been successfully deleted."
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (!asset) return null;

  const handleDownload = () => {
    window.open(asset.driveLink, '_blank');
  };

  const handleToggleFavorite = () => {
    toggleFavoriteMutation.mutate(asset.id);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this asset? This action cannot be undone.")) {
      deleteAssetMutation.mutate(asset.id);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const isImage = asset.mimeType.startsWith('image/');
  const isVideo = asset.mimeType.startsWith('video/');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {asset.filename}
          </h2>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-gray-400 hover:text-primary"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              className="text-gray-400 hover:text-red-500"
              title="Toggle favorite"
              disabled={toggleFavoriteMutation.isPending}
            >
              <Heart 
                className={`h-4 w-4 ${
                  asset.isFavorite ? 'fill-red-500 text-red-500' : ''
                }`} 
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex h-96">
          {/* Preview Area */}
          <div className="flex-1 bg-gray-100 flex items-center justify-center">
            {isImage && asset.thumbnailUrl ? (
              <img 
                src={asset.thumbnailUrl} 
                alt={asset.filename}
                className="max-w-full max-h-full object-contain"
              />
            ) : isVideo ? (
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-4xl">🎥</span>
                </div>
                <p className="text-gray-600">Video preview not available</p>
                <Button 
                  onClick={handleDownload}
                  variant="outline" 
                  className="mt-2"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Google Drive
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-4xl">📄</span>
                </div>
                <p className="text-gray-600">Preview not available</p>
                <Button 
                  onClick={handleDownload}
                  variant="outline" 
                  className="mt-2"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Google Drive
                </Button>
              </div>
            )}
          </div>
          
          {/* Asset Details */}
          <div className="w-80 bg-gray-50 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">File Name</label>
                <p className="text-gray-900 break-all">{asset.filename}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Category</label>
                <p className="text-gray-900">{asset.category}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Asset Type</label>
                <p className="text-gray-900">{asset.assetType}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Region</label>
                <p className="text-gray-900">{asset.region}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">State</label>
                <p className="text-gray-900">{asset.state}</p>
              </div>
              
              {asset.resort && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Resort</label>
                  <p className="text-gray-900">{asset.resort}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-600">Upload Date</label>
                <p className="text-gray-900">{formatDate(asset.uploadDate)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">File Size</label>
                <p className="text-gray-900">{formatFileSize(asset.fileSize)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Version</label>
                <p className="text-gray-900">V{asset.version}</p>
              </div>
              
              {asset.tags && asset.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {asset.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-600">Google Drive Link</label>
                <Button
                  variant="link"
                  onClick={handleDownload}
                  className="p-0 h-auto text-primary hover:underline text-sm"
                >
                  View in Google Drive
                </Button>
              </div>
              
              {asset.versionsLink && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Version History</label>
                  <Button
                    variant="link"
                    onClick={() => window.open(asset.versionsLink!, '_blank')}
                    className="p-0 h-auto text-primary hover:underline text-sm"
                  >
                    View All Versions
                  </Button>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2">
                <Button 
                  className="w-full bg-primary hover:bg-blue-700"
                  onClick={() => {
                    // TODO: Implement edit functionality
                    toast({
                      title: "Feature coming soon",
                      description: "Asset editing will be available in a future update."
                    });
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Asset
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement duplicate functionality
                    toast({
                      title: "Feature coming soon",
                      description: "Asset duplication will be available in a future update."
                    });
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
                
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleDelete}
                  disabled={deleteAssetMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteAssetMutation.isPending ? "Deleting..." : "Delete Asset"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
