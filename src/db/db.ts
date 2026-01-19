import Dexie, { Table } from 'dexie';
import { MeasurementType, MeasurementEntry } from '../models/Measurement';

export class TrackerDatabase extends Dexie {
  measurementTypes!: Table<MeasurementType, string>;
  measurementEntries!: Table<MeasurementEntry, string>;

  constructor() {
    super('TrackerDatabase');
    this.version(1).stores({
      measurementTypes: 'id',
      measurementEntries: 'id, typeId, date'
    });
  }
}

export const db = new TrackerDatabase();
