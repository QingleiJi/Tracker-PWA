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
    this.version(2).stores({
        measurementTypes: 'id, &slug', // Add unique index for slug
    }).upgrade(tx => {
        // Add a slug to existing measurement types
        return tx.table('measurementTypes').toCollection().modify(type => {
            if (type.name) {
                type.slug = type.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            }
        });
    });
  }
}

export const db = new TrackerDatabase();
