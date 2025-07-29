import { assets, users, type User, type InsertUser, type Asset, type InsertAsset, type UpdateAsset } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, gte, lte, inArray, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Asset methods
  getAssets(filters?: {
    category?: string;
    assetType?: string;
    region?: string;
    state?: string;
    resort?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Asset[]>;
  getAsset(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(asset: UpdateAsset): Promise<Asset>;
  deleteAsset(id: string): Promise<void>;
  getAssetCount(): Promise<number>;
  getRecentAssets(limit?: number): Promise<Asset[]>;
  getFavoriteAssets(): Promise<Asset[]>;
  toggleFavorite(id: string): Promise<Asset>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAssets(filters?: {
    category?: string;
    assetType?: string;
    region?: string;
    state?: string;
    resort?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Asset[]> {
    let query = db.select().from(assets);
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(assets.category, filters.category));
    }
    if (filters?.assetType) {
      conditions.push(eq(assets.assetType, filters.assetType));
    }
    if (filters?.region) {
      conditions.push(eq(assets.region, filters.region));
    }
    if (filters?.state) {
      conditions.push(eq(assets.state, filters.state));
    }
    if (filters?.resort) {
      conditions.push(eq(assets.resort, filters.resort));
    }
    if (filters?.startDate) {
      conditions.push(gte(assets.uploadDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(assets.uploadDate, filters.endDate));
    }
    if (filters?.search) {
      conditions.push(like(assets.filename, `%${filters.search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(assets.uploadDate));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset || undefined;
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db
      .insert(assets)
      .values(insertAsset)
      .returning();
    return asset;
  }

  async updateAsset(updateAsset: UpdateAsset): Promise<Asset> {
    const [asset] = await db
      .update(assets)
      .set({ ...updateAsset, updatedAt: new Date() })
      .where(eq(assets.id, updateAsset.id))
      .returning();
    return asset;
  }

  async deleteAsset(id: string): Promise<void> {
    await db.delete(assets).where(eq(assets.id, id));
  }

  async getAssetCount(): Promise<number> {
    const [result] = await db.select({ count: sql`count(*)` }).from(assets);
    return parseInt(result.count as string);
  }

  async getRecentAssets(limit = 10): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .orderBy(desc(assets.uploadDate))
      .limit(limit);
  }

  async getFavoriteAssets(): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.isFavorite, true))
      .orderBy(desc(assets.uploadDate));
  }

  async toggleFavorite(id: string): Promise<Asset> {
    const asset = await this.getAsset(id);
    if (!asset) throw new Error("Asset not found");
    
    const [updatedAsset] = await db
      .update(assets)
      .set({ isFavorite: !asset.isFavorite, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    
    return updatedAsset;
  }
}

export const storage = new DatabaseStorage();
