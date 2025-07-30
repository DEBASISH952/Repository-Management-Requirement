import { Asset } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Download, Eye, FileText, ImageIcon, Play, File } from "lucide-react";

interface AssetListProps {
  assets: Asset[];
  onPreview: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
  onToggleFavorite: (asset: Asset) => void;
  isLoading?: boolean;
}

export function AssetList({ 
  assets, 
  onPreview, 
  onDownload, 
  onToggleFavorite,
  isLoading 
}: AssetListProps) {
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
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/4"></div>
              </div>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <File className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
        <p className="text-gray-500">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assets.map((asset) => {
        const FileIcon = getFileIcon(asset.mimeType);
        const isImage = asset.mimeType.startsWith('image/');
        const isVideo = asset.mimeType.startsWith('video/');

        return (
          <div key={asset.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-center space-x-4">
              {/* Thumbnail */}
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {isImage && asset.thumbnailLink ? (
                  <img 
                    src={asset.thumbnailLink} 
                    alt={asset.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileIcon className="h-8 w-8 text-gray-400" />
                )}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                      {asset.originalName}
                    </h3>
                    
                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge 
                        variant="secondary" 
                        className={`${getAssetTypeColor(asset.assetType)} text-white`}
                      >
                        {asset.assetType}
                      </Badge>
                      <span className="text-xs text-gray-500">{asset.category}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{formatFileSize(asset.fileSize)}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{formatDate(asset.uploadDate)}</span>
                    </div>

                    {/* Location info */}
                    <div className="text-xs text-gray-500 space-x-1">
                      <span>{asset.region}</span>
                      {asset.state && (
                        <>
                          <span>•</span>
                          <span>{asset.state}</span>
                        </>
                      )}
                      {asset.resort && (
                        <>
                          <span>•</span>
                          <span>{asset.resort}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{asset.year}/{asset.month}</span>
                    </div>

                    {/* Tags */}
                    {asset.tags && asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {asset.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleFavorite(asset)}
                      className="p-2"
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          asset.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
                        }`} 
                      />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreview(asset)}
                      className="p-2"
                    >
                      <Eye className="h-4 w-4 text-gray-600" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(asset)}
                      className="p-2"
                    >
                      <Download className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}