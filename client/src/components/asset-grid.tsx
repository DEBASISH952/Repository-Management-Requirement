import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Download, 
  MoreVertical, 
  Heart,
  Play,
  FileText,
  File,
  Image as ImageIcon
} from "lucide-react";
import { Asset } from "@shared/schema";

interface AssetGridProps {
  assets: Asset[];
  onPreview: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
  onToggleFavorite: (asset: Asset) => void;
  isLoading?: boolean;
}

export function AssetGrid({ 
  assets, 
  onPreview, 
  onDownload, 
  onToggleFavorite,
  isLoading 
}: AssetGridProps) {
  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case "Static": return "bg-blue-500";
      case "Carousel": return "bg-yellow-500";
      case "Video": return "bg-red-500";
      case "Emailer": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return Play;
    if (mimeType.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="w-full h-48 bg-gray-200 animate-pulse" />
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                <div className="flex space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!assets.length) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
        <p className="text-gray-500">Try adjusting your filters or upload some assets to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {assets.map((asset) => {
        const FileIcon = getFileIcon(asset.mimeType);
        const isImage = asset.mimeType.startsWith('image/');
        const isVideo = asset.mimeType.startsWith('video/');

        return (
          <Card key={asset.id} className="asset-card overflow-hidden hover:shadow-lg transition-all">
            <div className="relative">
              {isImage && asset.thumbnailUrl ? (
                <img 
                  src={asset.thumbnailUrl} 
                  alt={asset.filename}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className={`w-full h-48 flex items-center justify-center ${
                  isImage ? 'bg-gradient-to-br from-blue-50 to-blue-100' :
                  isVideo ? 'bg-gradient-to-br from-red-50 to-red-100' :
                  asset.mimeType.includes('pdf') ? 'bg-gradient-to-br from-red-50 to-red-100' :
                  'bg-gradient-to-br from-gray-50 to-gray-100'
                }`}>
                  <FileIcon className={`text-6xl ${
                    isImage ? 'text-blue-500' :
                    isVideo ? 'text-red-500' :
                    asset.mimeType.includes('pdf') ? 'text-red-500' :
                    'text-gray-500'
                  }`} />
                </div>
              )}
              
              {isVideo && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <Play className="text-white text-3xl" />
                </div>
              )}
              
              <div className="absolute top-2 right-2">
                <Badge className={`${getAssetTypeColor(asset.assetType)} text-white text-xs font-medium`}>
                  {asset.assetType}
                </Badge>
              </div>
              
              <div className="absolute top-2 left-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFavorite(asset)}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full"
                >
                  <Heart 
                    className={`h-4 w-4 ${
                      asset.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                    }`} 
                  />
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-1 truncate" title={asset.filename}>
                {asset.filename}
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Uploaded {formatDate(new Date(asset.uploadDate))}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {formatFileSize(asset.fileSize)}
                </span>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPreview(asset)}
                    className="p-1 text-gray-400 hover:text-primary"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(asset)}
                    className="p-1 text-gray-400 hover:text-primary"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 text-gray-400 hover:text-primary"
                    title="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
