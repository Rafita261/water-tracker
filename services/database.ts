// database.ts
import * as SQLite from 'expo-sqlite';

export interface UserProfile {
  id: number;
  name: string;
  age: number;
  dailyGoal: number;
  createdAt: string;
}

export interface GlassType {
  id: number;
  name: string;
  volume: number;
}

export interface WaterLog {
  id: number;
  glassTypeId: number;
  volume: number;
  timestamp: string;
  date: string;
}

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  private initialized = false;

  async init() {
  if (this.initialized) return; 

  this.db = await SQLite.openDatabaseAsync('water-tracker.db');
  await this.createTables();

  this.initialized = true;
}


  private async createTables() {
    if (!this.db) return;

    // Table pour le profil utilisateur
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        dailyGoal INTEGER NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);

    // Table pour les types de verres
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS glass_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        volume INTEGER NOT NULL
      );
    `);

    // Table pour les logs d'hydratation
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS water_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        glassTypeId INTEGER NOT NULL,
        volume INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (glassTypeId) REFERENCES glass_types(id)
      );
    `);
  }

  // Profil utilisateur
  async saveUserProfile(name: string, age: number, dailyGoal: number) {
    if (!this.db) return;
    
    await this.db.runAsync(
      'INSERT INTO user_profile (name, age, dailyGoal, createdAt) VALUES (?, ?, ?, ?)',
      [name, age, dailyGoal, new Date().toISOString()]
    );
  }

  async getUserProfile(): Promise<UserProfile | null> {
    if (!this.db) return null;
    
    const result = await this.db.getFirstAsync<UserProfile>(
      'SELECT * FROM user_profile ORDER BY id DESC LIMIT 1'
    );
    return result;
  }

  async updateUserProfile(name: string, age: number, dailyGoal: number) {
    if (!this.db) return;
    
    await this.db.runAsync(
      'UPDATE user_profile SET name = ?, age = ?, dailyGoal = ? WHERE id = (SELECT MAX(id) FROM user_profile)',
      [name, age, dailyGoal]
    );
  }

  // Types de verres
  async addGlassType(name: string, volume: number) {
    if (!this.db) return;
    
    const result = await this.db.runAsync(
      'INSERT INTO glass_types (name, volume) VALUES (?, ?)',
      [name, volume]
    );
    return result.lastInsertRowId;
  }

  async getGlassTypes(): Promise<GlassType[]> {
    if (!this.db) return [];
    
    const result = await this.db.getAllAsync<GlassType>(
      'SELECT * FROM glass_types'
    );
    return result;
  }

  async deleteGlassType(id: number) {
    if (!this.db) return;
    
    await this.db.runAsync('DELETE FROM glass_types WHERE id = ?', [id]);
  }

  // Logs d'hydratation
  async addWaterLog(glassTypeId: number, volume: number) {
    if (!this.db) return;
    
    const now = new Date();
    const timestamp = now.toISOString();
    const date = now.toISOString().split('T')[0];
    
    await this.db.runAsync(
      'INSERT INTO water_logs (glassTypeId, volume, timestamp, date) VALUES (?, ?, ?, ?)',
      [glassTypeId, volume, timestamp, date]
    );
  }

  async getWaterLogsForDate(date: string): Promise<WaterLog[]> {
    if (!this.db) return [];
    
    const result = await this.db.getAllAsync<WaterLog>(
      'SELECT * FROM water_logs WHERE date = ? ORDER BY timestamp DESC',
      [date]
    );
    return result;
  }

  async getTotalForDate(date: string): Promise<number> {
    if (!this.db) return 0;
    
    const result = await this.db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(volume), 0) as total FROM water_logs WHERE date = ?',
      [date]
    );
    return result?.total || 0;
  }

  async getWeeklyData(startDate: string, endDate: string) {
    if (!this.db) return [];
    
    const result = await this.db.getAllAsync<{ date: string; total: number }>(
      'SELECT date, SUM(volume) as total FROM water_logs WHERE date BETWEEN ? AND ? GROUP BY date ORDER BY date',
      [startDate, endDate]
    );
    return result;
  }

  async getConsecutiveDays(): Promise<number> {
    if (!this.db) return 0;
    
    const profile = await this.getUserProfile();
    if (!profile) return 0;

    // Récupérer tous les jours où l'objectif a été atteint
    const result = await this.db.getAllAsync<{ date: string; total: number }>(
      'SELECT date, SUM(volume) as total FROM water_logs GROUP BY date HAVING total >= ? ORDER BY date DESC',
      [profile.dailyGoal]
    );

    let consecutive = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < result.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expected = expectedDate.toISOString().split('T')[0];
      
      if (result[i].date === expected) {
        consecutive++;
      } else {
        break;
      }
    }
    
    return consecutive;
  }

  async getTotalDaysAchieved(): Promise<number> {
    if (!this.db) return 0;
    
    const profile = await this.getUserProfile();
    if (!profile) return 0;

    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(DISTINCT date) as count FROM water_logs GROUP BY date HAVING SUM(volume) >= ?',
      [profile.dailyGoal]
    );
    
    return result?.count || 0;
  }
}

export const database = new Database();