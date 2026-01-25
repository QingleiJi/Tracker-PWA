import React, { useMemo, useState } from 'react';
import { IonButton, IonButtons, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonTitle, IonToggle, IonToolbar } from '@ionic/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MeasurementEntry } from '../models/Measurement';
import { format } from 'date-fns';

interface Props {
  entries: MeasurementEntry[];
}

const TIME_STEPS_MS = [
  60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000,
  30 * 60 * 1000,
  60 * 60 * 1000,
  2 * 60 * 60 * 1000,
  4 * 60 * 60 * 1000,
  6 * 60 * 60 * 1000,
  12 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
  2 * 24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  14 * 24 * 60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000
];

const niceStep = (range: number, targetTicks: number) => {
  if (!Number.isFinite(range) || range <= 0) return 1;
  const rough = range / targetTicks;
  const power = Math.pow(10, Math.floor(Math.log10(rough)));
  const fraction = rough / power;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * power;
};

const pickTimeStep = (rangeMs: number, targetTicks: number) => {
  if (!Number.isFinite(rangeMs) || rangeMs <= 0) return TIME_STEPS_MS[0];
  const rough = rangeMs / targetTicks;
  return TIME_STEPS_MS.find(step => step >= rough) ?? TIME_STEPS_MS[TIME_STEPS_MS.length - 1];
};

const buildTicks = (minValue: number, maxValue: number, step: number) => {
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || !Number.isFinite(step) || step <= 0 || maxValue <= minValue) return undefined;
  const ticks: number[] = [];
  let value = minValue;
  const guard = 1000;
  let count = 0;
  while (value <= maxValue + (step / 2) && count < guard) {
    ticks.push(value);
    value += step;
    count += 1;
  }
  return ticks;
};

const MeasurementChart: React.FC<Props> = ({ entries }) => {
  if (!entries || entries.length === 0) return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data</div>;

  const [isYAxisModalOpen, setIsYAxisModalOpen] = useState(false);
  const [isXAxisModalOpen, setIsXAxisModalOpen] = useState(false);
  const [yAuto, setYAuto] = useState(true);
  const [xAuto, setXAuto] = useState(true);
  const [gridMode, setGridMode] = useState<'light' | 'strong' | 'off'>('light');
  const [yMin, setYMin] = useState<number | undefined>(undefined);
  const [yMax, setYMax] = useState<number | undefined>(undefined);
  const [yInterval, setYInterval] = useState<number | undefined>(undefined);
  const [xStart, setXStart] = useState<number | undefined>(undefined);
  const [xEnd, setXEnd] = useState<number | undefined>(undefined);
  const [xIntervalDays, setXIntervalDays] = useState<number | undefined>(undefined);
  const [yMinInput, setYMinInput] = useState('');
  const [yMaxInput, setYMaxInput] = useState('');
  const [yIntervalInput, setYIntervalInput] = useState('');
  const [xStartInput, setXStartInput] = useState('');
  const [xEndInput, setXEndInput] = useState('');
  const [xIntervalInput, setXIntervalInput] = useState('');

  const data = entries.map(e => ({
      ...e,
      dateStr: format(e.date, 'MMM d'),
      time: e.date.getTime(),
  })).sort((a, b) => a.time - b.time);

  // Check if we have values
  const hasValues = data.some(d => d.value !== undefined);

  if (!hasValues) {
      return <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>Timeline view (entries without values) is not yet supported in this chart.</div>
  }

  const openYAxisSettings = () => {
    setYMinInput(yMin !== undefined ? String(yMin) : '');
    setYMaxInput(yMax !== undefined ? String(yMax) : '');
    setYIntervalInput(yInterval !== undefined ? String(yInterval) : '');
    setIsYAxisModalOpen(true);
  };

  const openXAxisSettings = () => {
    setXStartInput(xStart !== undefined ? new Date(xStart).toISOString() : '');
    setXEndInput(xEnd !== undefined ? new Date(xEnd).toISOString() : '');
    setXIntervalInput(xIntervalDays !== undefined ? String(xIntervalDays) : '');
    setIsXAxisModalOpen(true);
  };

  const cycleGrid = () => {
    setGridMode(prev => (prev === 'light' ? 'strong' : prev === 'strong' ? 'off' : 'light'));
  };

  const gridOpacity = gridMode === 'strong' ? 0.9 : 0.45;

  const chartData = useMemo(() => {
    if (xAuto) return data;
    return data.filter(d => {
      if (xStart !== undefined && d.time < xStart) return false;
      if (xEnd !== undefined && d.time > xEnd) return false;
      return true;
    });
  }, [data, xAuto, xEnd, xStart]);

  const numericValues = (chartData.length ? chartData : data)
    .map(d => d.value)
    .filter((value): value is number => typeof value === 'number');
  const dataMin = Math.min(...numericValues);
  const dataMax = Math.max(...numericValues);
  const timeMin = chartData.length ? chartData[0].time : data[0].time;
  const timeMax = chartData.length ? chartData[chartData.length - 1].time : data[data.length - 1].time;

  const yAutoConfig = useMemo(() => {
    if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) return { domain: ['dataMin', 'dataMax'] as const, ticks: undefined as number[] | undefined };
    const range = dataMax - dataMin;
    const step = niceStep(range === 0 ? 1 : range, 6);
    const niceMin = range === 0 ? dataMin - step : Math.floor(dataMin / step) * step;
    const niceMax = range === 0 ? dataMax + step : Math.ceil(dataMax / step) * step;
    const ticks = buildTicks(niceMin, niceMax, step);
    return { domain: [niceMin, niceMax] as const, ticks };
  }, [dataMax, dataMin]);

  const xAutoConfig = useMemo(() => {
    if (!Number.isFinite(timeMin) || !Number.isFinite(timeMax) || timeMax <= timeMin) return { domain: ['dataMin', 'dataMax'] as const, ticks: undefined as number[] | undefined, stepMs: TIME_STEPS_MS[0] };
    const range = timeMax - timeMin;
    const stepMs = pickTimeStep(range, 8);
    const niceMin = Math.floor(timeMin / stepMs) * stepMs;
    const niceMax = Math.ceil(timeMax / stepMs) * stepMs;
    const ticks = buildTicks(niceMin, niceMax, stepMs);
    return { domain: [niceMin, niceMax] as const, ticks, stepMs };
  }, [timeMax, timeMin]);

  const yDomain = useMemo(() => {
    if (yAuto) return yAutoConfig.domain;
    return [yMin ?? 'dataMin', yMax ?? 'dataMax'];
  }, [yAuto, yAutoConfig.domain, yMin, yMax]);

  const xDomain = useMemo(() => {
    if (xAuto) return xAutoConfig.domain;
    return [xStart ?? 'dataMin', xEnd ?? 'dataMax'];
  }, [xAuto, xAutoConfig.domain, xEnd, xStart]);

  const yTicks = useMemo(() => {
    if (yAuto) return yAutoConfig.ticks;
    if (yInterval === undefined) return undefined;
    if (yInterval <= 0) return undefined;
    const minValue = yMin ?? dataMin;
    const maxValue = yMax ?? dataMax;
    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || maxValue <= minValue) return undefined;
    const precision = Math.max(0, (yInterval.toString().split('.')[1] || '').length);
    return buildTicks(minValue, maxValue, yInterval)?.map(value => Number(value.toFixed(precision)));
  }, [dataMax, dataMin, yAuto, yAutoConfig.ticks, yInterval, yMax, yMin]);

  const xTicks = useMemo(() => {
    if (xAuto) return xAutoConfig.ticks;
    if (xIntervalDays === undefined) return undefined;
    if (xIntervalDays <= 0) return undefined;
    const intervalMs = xIntervalDays * 24 * 60 * 60 * 1000;
    const minValue = xStart ?? timeMin;
    const maxValue = xEnd ?? timeMax;
    return buildTicks(minValue, maxValue, intervalMs);
  }, [timeMax, timeMin, xAuto, xAutoConfig.ticks, xEnd, xIntervalDays, xStart]);

  const xLabelFormat = useMemo(() => {
    if (xAuto) return xAutoConfig.stepMs >= 24 * 60 * 60 * 1000 ? 'MMM d' : 'MMM d, h:mm a';
    if (xIntervalDays !== undefined && xIntervalDays < 1) return 'MMM d, h:mm a';
    return 'MMM d';
  }, [xAuto, xAutoConfig.stepMs, xIntervalDays]);

  const saveYAxisSettings = () => {
    const nextMin = yMinInput.trim() === '' ? undefined : Number(yMinInput);
    const nextMax = yMaxInput.trim() === '' ? undefined : Number(yMaxInput);
    const nextInterval = yIntervalInput.trim() === '' ? undefined : Number(yIntervalInput);

    if (!yAuto) {
      if ((nextMin !== undefined && Number.isNaN(nextMin)) || (nextMax !== undefined && Number.isNaN(nextMax))) {
        alert('Range must be numeric values or left blank for auto.');
        return;
      }
      if (nextMin !== undefined && nextMax !== undefined && nextMax <= nextMin) {
        alert('Max must be greater than min.');
        return;
      }
      if (nextInterval !== undefined && (Number.isNaN(nextInterval) || nextInterval <= 0)) {
        alert('Interval must be a positive number.');
        return;
      }
    }

    setYMin(nextMin);
    setYMax(nextMax);
    setYInterval(nextInterval);
    setIsYAxisModalOpen(false);
  };

  const saveXAxisSettings = () => {
    const nextXStart = xStartInput.trim() === '' ? undefined : new Date(xStartInput);
    const nextXEnd = xEndInput.trim() === '' ? undefined : new Date(xEndInput);
    const nextXInterval = xIntervalInput.trim() === '' ? undefined : Number(xIntervalInput);

    if (!xAuto) {
      if ((nextXStart && Number.isNaN(nextXStart.getTime())) || (nextXEnd && Number.isNaN(nextXEnd.getTime()))) {
        alert('Dates must be valid or left blank for auto.');
        return;
      }
      if (nextXStart && nextXEnd && nextXEnd <= nextXStart) {
        alert('End date must be after start date.');
        return;
      }
      if (nextXInterval !== undefined && (Number.isNaN(nextXInterval) || nextXInterval <= 0)) {
        alert('X interval must be a positive number of days.');
        return;
      }
    }

    setXStart(nextXStart ? nextXStart.getTime() : undefined);
    setXEnd(nextXEnd ? nextXEnd.getTime() : undefined);
    setXIntervalDays(nextXInterval);
    setIsXAxisModalOpen(false);
  };

  const XAxisTick = (props: { x?: number; y?: number; payload?: { value: number } }) => {
    const { x, y, payload } = props;
    return (
      <text x={x} y={y} dy={18} textAnchor="middle" fill="#8e8e93" fontSize={11} style={{ cursor: 'pointer' }} onClick={openXAxisSettings}>
        {payload?.value ? format(new Date(payload.value), xLabelFormat) : ''}
      </text>
    );
  };

  const YAxisTick = (props: { x?: number; y?: number; payload?: { value: string | number } }) => {
    const { x, y, payload } = props;
    return (
      <text x={x} y={y} dx={-2} dy={4} textAnchor="end" fill="#8e8e93" fontSize={11} style={{ cursor: 'pointer' }} onClick={openYAxisSettings}>
        {payload?.value}
      </text>
    );
  };

  return (
    <>
      <div style={{ width: '100%', height: 300, background: 'white', borderRadius: 16, padding: '16px 0', marginBottom: 16, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 6, right: 8, zIndex: 2 }}>
          <IonButton size="small" fill="clear" onClick={cycleGrid} style={{ fontSize: 11 }}>
            Grid: {gridMode}
          </IonButton>
        </div>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 12, bottom: 16 }}>
            {gridMode !== 'off' && (
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dfe3e8" strokeOpacity={gridOpacity} />
            )}
            <XAxis 
                dataKey="time"
                type="number"
                domain={xDomain}
                ticks={xTicks}
                tickLine={false} 
                axisLine={false} 
                tickMargin={12}
                tick={XAxisTick}
                height={30}
                allowDataOverflow={true}
            />
            <YAxis 
                domain={yDomain}
                ticks={yTicks}
                axisLine={false} 
                tickLine={false} 
                width={52}
                tick={YAxisTick}
                allowDataOverflow={true}
            />
            <Tooltip 
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#8e8e93', marginBottom: 4, fontSize: 12 }}
                itemStyle={{ color: 'var(--ion-color-primary)', fontWeight: 600, fontSize: 14 }}
                cursor={{ stroke: 'var(--ion-color-primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                labelFormatter={(value: number) => format(new Date(value), xLabelFormat)}
            />
            <Line 
                type="monotone" 
                dataKey="value" 
                stroke="var(--ion-color-primary)" 
                strokeWidth={3} 
                dot={{ r: 3, fill: 'var(--ion-color-primary)', strokeWidth: 0 }} 
                activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }} 
                isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <IonModal isOpen={isYAxisModalOpen} onDidDismiss={() => setIsYAxisModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Y Axis Settings</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsYAxisModalOpen(false)}>Cancel</IonButton>
              <IonButton strong onClick={saveYAxisSettings}>Apply</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent color="light">
          <IonList inset>
            <IonItem>
              <IonToggle checked={yAuto} onIonChange={e => setYAuto(e.detail.checked)}>
                Auto range
              </IonToggle>
            </IonItem>
            <IonItem>
              <IonInput
                label="Y min (auto if blank)"
                labelPlacement="stacked"
                inputMode="decimal"
                value={yMinInput}
                onIonInput={e => setYMinInput(e.detail.value ?? '')}
                disabled={yAuto}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Y max (auto if blank)"
                labelPlacement="stacked"
                inputMode="decimal"
                value={yMaxInput}
                onIonInput={e => setYMaxInput(e.detail.value ?? '')}
                disabled={yAuto}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Y interval (auto if blank)"
                labelPlacement="stacked"
                inputMode="decimal"
                value={yIntervalInput}
                onIonInput={e => setYIntervalInput(e.detail.value ?? '')}
                disabled={yAuto}
              />
            </IonItem>
          </IonList>
        </IonContent>
      </IonModal>

      <IonModal isOpen={isXAxisModalOpen} onDidDismiss={() => setIsXAxisModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>X Axis Settings</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsXAxisModalOpen(false)}>Cancel</IonButton>
              <IonButton strong onClick={saveXAxisSettings}>Apply</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent color="light">
          <IonList inset>
            <IonItem>
              <IonToggle checked={xAuto} onIonChange={e => setXAuto(e.detail.checked)}>
                Auto range
              </IonToggle>
            </IonItem>
            <IonItem>
              <IonLabel>Start date</IonLabel>
              <IonDatetimeButton datetime="xstart" disabled={xAuto} />
              <IonModal keepContentsMounted={true}>
                <IonDatetime
                  id="xstart"
                  presentation="date-time"
                  value={xStartInput || undefined}
                  onIonChange={e => setXStartInput(e.detail.value as string)}
                />
              </IonModal>
            </IonItem>
            <IonItem>
              <IonLabel>End date</IonLabel>
              <IonDatetimeButton datetime="xend" disabled={xAuto} />
              <IonModal keepContentsMounted={true}>
                <IonDatetime
                  id="xend"
                  presentation="date-time"
                  value={xEndInput || undefined}
                  onIonChange={e => setXEndInput(e.detail.value as string)}
                />
              </IonModal>
            </IonItem>
            <IonItem>
              <IonInput
                label="X interval (days, auto if blank)"
                labelPlacement="stacked"
                inputMode="decimal"
                value={xIntervalInput}
                onIonInput={e => setXIntervalInput(e.detail.value ?? '')}
                disabled={xAuto}
              />
            </IonItem>
          </IonList>
        </IonContent>
      </IonModal>
    </>
  );
};

export default MeasurementChart;
