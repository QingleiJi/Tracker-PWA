export type FrequencyType = 'byHour' | 'byDay';

export interface AxisConfig {
  isAuto: boolean;
  min?: number;
  max?: number;
  stride?: number;
  label?: string;
}

export interface MeasurementType {
  id: string;
  name: string;
  slug?: string;
  frequencyType: FrequencyType;
  hourFrequency?: number;
  hourStartDate?: Date;
  daysOfWeek?: number[];
  reminderTime?: Date;
  xAxisConfig?: AxisConfig;
  yAxisConfig?: AxisConfig;
}

export interface MeasurementEntry {
  id: string;
  typeId: string;
  date: Date;
  value?: number;
}
