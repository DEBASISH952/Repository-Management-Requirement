import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAssetSchema, updateAssetSchema } from "@shared/schema";
import multer from "multer";
import { google } from "googleapis";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Google Drive API setup (optional if credentials are provided)
let drive: any = null;
try {
  if (process.env.GOOGLE_CREDENTIALS_PATH) {
    drive = google.drive({
      version: 'v3',
      auth: new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/drive.file']
      })
    });
  }
} catch (error) {
  console.log('Google Drive credentials not configured, using local storage');
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all assets with filtering
  app.get("/api/assets", async (req, res) => {
    try {
      const {
        category,
        assetType,
        region,
        state,
        resort,
        startDate,
        endDate,
        search,
        limit = 20,
        offset = 0
      } = req.query;

      const filters = {
        category: category as string,
        assetType: assetType as string,
        region: region as string,
        state: state as string,
        resort: resort as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const assets = await storage.getAssets(filters);
      const totalCount = await storage.getAssetCount();

      res.json({
        assets,
        totalCount,
        hasMore: (parseInt(offset as string) + parseInt(limit as string)) < totalCount
      });
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  // Get single asset
  app.get("/api/assets/:id", async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      console.error("Error fetching asset:", error);
      res.status(500).json({ message: "Failed to fetch asset" });
    }
  });

  // Export assets to Excel
  app.get("/api/assets/export/excel", async (req, res) => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Assets');

      // Define columns
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 20 },
        { header: 'Filename', key: 'filename', width: 30 },
        { header: 'Original Name', key: 'originalName', width: 25 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Asset Type', key: 'assetType', width: 15 },
        { header: 'Region', key: 'region', width: 15 },
        { header: 'State', key: 'state', width: 15 },
        { header: 'Resort', key: 'resort', width: 20 },
        { header: 'Year', key: 'year', width: 10 },
        { header: 'Month', key: 'month', width: 10 },
        { header: 'Version', key: 'version', width: 10 },
        { header: 'File Size (bytes)', key: 'fileSize', width: 15 },
        { header: 'MIME Type', key: 'mimeType', width: 20 },
        { header: 'Upload Date', key: 'uploadDate', width: 20 },
        { header: 'Tags', key: 'tags', width: 30 },
        { header: 'Favorite', key: 'isFavorite', width: 10 },
        { header: 'Drive Link', key: 'driveLink', width: 40 }
      ];

      // Get all assets
      const assets = await storage.getAssets({});

      // Add data rows
      if (assets && Array.isArray(assets)) {
        assets.forEach(asset => {
        worksheet.addRow({
          id: asset.id,
          filename: asset.filename,
          originalName: asset.originalName,
          category: asset.category,
          assetType: asset.assetType,
          region: asset.region,
          state: asset.state,
          resort: asset.resort || '',
          year: asset.year,
          month: asset.month,
          version: asset.version,
          fileSize: asset.fileSize,
          mimeType: asset.mimeType,
          uploadDate: asset.uploadDate?.toISOString() || '',
          tags: Array.isArray(asset.tags) ? asset.tags.join(', ') : '',
          isFavorite: asset.isFavorite ? 'Yes' : 'No',
          driveLink: asset.driveLink || ''
        });
        });
      }

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="assets-export-${new Date().toISOString().split('T')[0]}.xlsx"`);

      // Write to response
      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error("Error exporting to Excel:", error);
      res.status(500).json({ message: "Failed to export to Excel" });
    }
  });

  // Upload assets
  app.post("/api/assets/upload", upload.array('files'), async (req, res) => {
    try {
      const files = req.files as any[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const { category, assetType, region, state, resort, tags } = req.body;
      const uploadedAssets = [];

      for (const file of files) {
        // Generate unique filename following convention
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        const version = 1; // TODO: Check for existing versions
        
        const filename = `${year}_${month.toString().padStart(2, '0')}_${region}_${resort || 'Brand'}_${assetType}_V${version}`;
        const extension = path.extname(file.originalname);
        const fullFilename = `${filename}${extension}`;

        let driveFileId = 'local';
        let driveFolderId = 'local';
        let driveLink = `/uploads/${file.filename}`;
        let versionsLink = `/uploads/`;
        let thumbnailUrl = null;

        if (drive) {
          try {
            // Create folder structure in Google Drive
            const folderPath = `Assets/${category}/${region}/${state}/${resort || 'Brand'}/${year}/${month.toString().padStart(2, '0')}/${assetType}`;
            const folderId = await createDriveFolder(folderPath);

            // Upload file to Google Drive
            const fileMetadata = {
              name: fullFilename,
              parents: [folderId]
            };

            const media = {
              mimeType: file.mimetype,
              body: fs.createReadStream(file.path)
            };

            const driveResponse = await drive.files.create({
              requestBody: fileMetadata,
              media: media,
              fields: 'id,webViewLink'
            });

            driveFileId = driveResponse.data.id!;
            driveFolderId = folderId;
            driveLink = driveResponse.data.webViewLink!;
            versionsLink = `https://drive.google.com/drive/folders/${folderId}`;
            thumbnailUrl = file.mimetype.startsWith('image/') ? driveResponse.data.webViewLink! : null;

            // Clean up local file
            fs.unlinkSync(file.path);
          } catch (error) {
            console.log('Google Drive upload failed, keeping local file:', error.message);
            // Keep the local file as fallback
          }
        } else {
          // Keep local file and create a local URL
          const localPath = path.join('uploads', file.filename);
          if (file.mimetype.startsWith('image/')) {
            thumbnailUrl = `/uploads/${file.filename}`;
          }
        }

        // Create asset record
        const assetData = {
          filename: fullFilename,
          originalName: file.originalname,
          category,
          assetType,
          region,
          state,
          resort: resort || null,
          year,
          month,
          version,
          fileSize: file.size,
          mimeType: file.mimetype,
          googleDriveFileId: driveFileId,
          googleDriveFolderId: driveFolderId,
          driveLink: driveLink,
          versionsLink: versionsLink,
          thumbnailUrl: thumbnailUrl,
          tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : []
        };

        const validatedData = insertAssetSchema.parse(assetData);
        const asset = await storage.createAsset(validatedData);
        uploadedAssets.push(asset);
      }

      res.json({ 
        message: "Assets uploaded successfully", 
        assets: uploadedAssets 
      });
    } catch (error) {
      console.error("Error uploading assets:", error);
      res.status(500).json({ message: "Failed to upload assets" });
    }
  });

  // Update asset
  app.patch("/api/assets/:id", async (req, res) => {
    try {
      const updateData = updateAssetSchema.parse({
        ...req.body,
        id: req.params.id
      });
      
      const asset = await storage.updateAsset(updateData);
      res.json(asset);
    } catch (error) {
      console.error("Error updating asset:", error);
      res.status(500).json({ message: "Failed to update asset" });
    }
  });

  // Delete asset
  app.delete("/api/assets/:id", async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      // Delete from Google Drive
      await drive.files.delete({ fileId: asset.googleDriveFileId });
      
      // Delete from database
      await storage.deleteAsset(req.params.id);
      
      res.json({ message: "Asset deleted successfully" });
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ message: "Failed to delete asset" });
    }
  });

  // Toggle favorite
  app.patch("/api/assets/:id/favorite", async (req, res) => {
    try {
      const asset = await storage.toggleFavorite(req.params.id);
      res.json(asset);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // Export to Excel
  app.get("/api/assets/export/excel", async (req, res) => {
    try {
      const assets = await storage.getAssets();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Assets');

      // Add headers
      worksheet.columns = [
        { header: 'Filename', key: 'filename', width: 30 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Asset Type', key: 'assetType', width: 15 },
        { header: 'Region', key: 'region', width: 15 },
        { header: 'State', key: 'state', width: 15 },
        { header: 'Resort', key: 'resort', width: 20 },
        { header: 'Year', key: 'year', width: 10 },
        { header: 'Month', key: 'month', width: 10 },
        { header: 'Version', key: 'version', width: 10 },
        { header: 'File Size', key: 'fileSize', width: 15 },
        { header: 'Upload Date', key: 'uploadDate', width: 20 },
        { header: 'Drive Link', key: 'driveLink', width: 50 },
        { header: 'Versions Link', key: 'versionsLink', width: 50 },
        { header: 'Tags', key: 'tags', width: 30 }
      ];

      // Add data
      assets.forEach(asset => {
        worksheet.addRow({
          ...asset,
          tags: Array.isArray(asset.tags) ? asset.tags.join(', ') : '',
          fileSize: `${(asset.fileSize / 1024 / 1024).toFixed(2)} MB`,
          uploadDate: asset.uploadDate.toISOString().split('T')[0]
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=assets-export.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      res.status(500).json({ message: "Failed to export to Excel" });
    }
  });

  // Get statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const totalAssets = await storage.getAssetCount();
      const recentAssets = await storage.getRecentAssets();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const thisMonthAssets = await storage.getAssets({
        startDate: new Date(currentYear, currentMonth - 1, 1),
        endDate: new Date(currentYear, currentMonth, 0)
      });

      res.json({
        totalAssets,
        thisMonth: thisMonthAssets.length,
        pendingReview: 0 // TODO: Implement review system
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to create folder structure in Google Drive
async function createDriveFolder(folderPath: string): Promise<string> {
  const folders = folderPath.split('/');
  let parentId = 'root';

  for (const folderName of folders) {
    if (!folderName) continue;

    // Check if folder exists
    const response = await drive.files.list({
      q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)'
    });

    if (response.data.files && response.data.files.length > 0) {
      parentId = response.data.files[0].id!;
    } else {
      // Create folder
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id'
      });

      parentId = folder.data.id!;
    }
  }

  return parentId;
}
