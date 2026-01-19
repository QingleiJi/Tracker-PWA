import { db } from '../db/db';
import { MeasurementType, MeasurementEntry } from '../models/Measurement';

interface BackupData {
  version: number;
  measurementTypes: MeasurementType[];
  measurementEntries: MeasurementEntry[];
}

export const exportData = async (): Promise<void> => {
  try {
    const measurementTypes = await db.measurementTypes.toArray();
    const measurementEntries = await db.measurementEntries.toArray();

    const data: BackupData = {
      version: 1,
      measurementTypes,
      measurementEntries,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export data:', error);
    throw error;
  }
};

export const importData = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonContent = e.target?.result as string;
        if (!jsonContent) {
          throw new Error('File content is empty');
        }

        const data: BackupData = JSON.parse(jsonContent);

        if (!data.measurementTypes || !data.measurementEntries) {
          throw new Error('Invalid backup file format');
        }

        // Deserialize Dates
        const types = data.measurementTypes.map(t => ({
          ...t,
          hourStartDate: t.hourStartDate ? new Date(t.hourStartDate) : undefined,
          reminderTime: t.reminderTime ? new Date(t.reminderTime) : undefined,
        }));

        const entries = data.measurementEntries.map(e => ({
          ...e,
          date: new Date(e.date),
        }));

        await db.transaction('rw', db.measurementTypes, db.measurementEntries, async () => {
          await db.measurementTypes.bulkPut(types);
          await db.measurementEntries.bulkPut(entries);
        });

        resolve();
      } catch (error) {
        console.error('Failed to import data:', error);
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
