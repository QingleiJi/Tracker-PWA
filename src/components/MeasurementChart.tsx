import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IonButton, IonButtons, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonSelect, IonSelectOption, IonTitle, IonToggle, IonToolbar } from '@ionic/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { AxisDomain } from 'recharts/types/util/types';
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

const X_INTERVAL_OPTIONS = [
  { label: '1 minute', ms: 60 * 1000 },
  { label: '5 minutes', ms: 5 * 60 * 1000 },
  { label: '15 minutes', ms: 15 * 60 * 1000 },
  { label: '30 minutes', ms: 30 * 60 * 1000 },
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: '2 hours', ms: 2 * 60 * 60 * 1000 },
  { label: '6 hours', ms: 6 * 60 * 60 * 1000 },
  { label: '12 hours', ms: 12 * 60 * 60 * 1000 },
  { label: '1 day', ms: 24 * 60 * 60 * 1000 }
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatNumber = (value: number, maxDecimals = 3) => value.toFixed(maxDecimals).replace(/\.?0+$/, '');

const getNumericDomain = (domain: AxisDomain) => {
  if (Array.isArray(domain)) {
    const [min, max] = domain;
    return {
      min: typeof min === 'number' ? min : undefined,
      max: typeof max === 'number' ? max : undefined
    };
  }
  return { min: undefined, max: undefined };
};

const pickTickCount = (availablePx: number, minPixelsPerTick: number) => {
  if (!Number.isFinite(availablePx) || availablePx <= 0) return 8;
  const maxPossible = Math.max(2, Math.floor(availablePx / minPixelsPerTick));
  if (maxPossible < 8) return maxPossible;
  return Math.min(10, Math.max(8, maxPossible));
};

const MeasurementChart: React.FC<Props> = ({ entries }) => {
  if (!entries || entries.length === 0) return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data</div>;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  const [isYAxisModalOpen, setIsYAxisModalOpen] = useState(false);
  const [isXAxisModalOpen, setIsXAxisModalOpen] = useState(false);
  const [yAuto, setYAuto] = useState(true);
  const [xAuto, setXAuto] = useState(true);
  const [gridMode, setGridMode] = useState<'light' | 'strong' | 'bold' | 'off'>('light');
  const [yMin, setYMin] = useState<number | undefined>(undefined);
  const [yMax, setYMax] = useState<number | undefined>(undefined);
  const [yInterval, setYInterval] = useState<number | undefined>(undefined);
  const [xStart, setXStart] = useState<number | undefined>(undefined);
  const [xEnd, setXEnd] = useState<number | undefined>(undefined);
  const [xIntervalMs, setXIntervalMs] = useState<number | undefined>(undefined);
  const [yMinInput, setYMinInput] = useState('');
  const [yMaxInput, setYMaxInput] = useState('');
  const [yIntervalInput, setYIntervalInput] = useState('');
  const [xStartInput, setXStartInput] = useState('');
  const [xEndInput, setXEndInput] = useState('');
  const [xIntervalInput, setXIntervalInput] = useState('');

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const observer = new ResizeObserver(entriesList => {
      for (const entry of entriesList) {
        const { width, height } = entry.contentRect;
        setChartSize({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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
    const { min: autoMin, max: autoMax } = getNumericDomain(yAutoConfig.domain);
    const autoInterval = yAutoConfig.ticks && yAutoConfig.ticks.length > 1
      ? yAutoConfig.ticks[1] - yAutoConfig.ticks[0]
      : undefined;

    setYMinInput(yAuto ? (autoMin !== undefined ? formatNumber(autoMin) : '') : (yMin !== undefined ? String(yMin) : ''));
    setYMaxInput(yAuto ? (autoMax !== undefined ? formatNumber(autoMax) : '') : (yMax !== undefined ? String(yMax) : ''));
    setYIntervalInput(yAuto ? (autoInterval !== undefined ? formatNumber(autoInterval) : '') : (yInterval !== undefined ? String(yInterval) : ''));
    setIsYAxisModalOpen(true);
  };

  const openXAxisSettings = () => {
    const { min: autoStart, max: autoEnd } = getNumericDomain(xAutoConfig.domain);
    const autoIntervalMs = xAutoConfig.stepMs;
    const intervalValue = autoIntervalMs !== undefined && X_INTERVAL_OPTIONS.some(option => option.ms === autoIntervalMs)
      ? String(autoIntervalMs)
      : '';

    setXStartInput(xAuto ? (autoStart !== undefined ? new Date(autoStart).toISOString() : '') : (xStart !== undefined ? new Date(xStart).toISOString() : ''));
    setXEndInput(xAuto ? (autoEnd !== undefined ? new Date(autoEnd).toISOString() : '') : (xEnd !== undefined ? new Date(xEnd).toISOString() : ''));
    setXIntervalInput(xAuto ? intervalValue : (xIntervalMs !== undefined ? String(xIntervalMs) : ''));
    setIsXAxisModalOpen(true);
  };

  const cycleGrid = () => {
    setGridMode(prev => (prev === 'light' ? 'strong' : prev === 'strong' ? 'bold' : prev === 'bold' ? 'off' : 'light'));
  };

  const gridStyle = useMemo(() => {
    if (gridMode === 'bold') return { stroke: '#9aa4af', strokeOpacity: 0.95, strokeWidth: 1.5, strokeDasharray: '2 2' };
    if (gridMode === 'strong') return { stroke: '#c4cbd3', strokeOpacity: 0.75, strokeWidth: 1, strokeDasharray: '3 3' };
    return { stroke: '#dfe3e8', strokeOpacity: 0.45, strokeWidth: 1, strokeDasharray: '3 3' };
  }, [gridMode]);

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

  const yLabelChars = useMemo(() => {
    if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) return 3;
    const maxAbs = Math.max(Math.abs(dataMin), Math.abs(dataMax));
    const precision = yInterval !== undefined ? Math.min(3, Math.max(0, (yInterval.toString().split('.')[1] || '').length)) : 2;
    const text = maxAbs.toFixed(precision).replace(/\.?0+$/, '');
    const hasNegative = dataMin < 0;
    return text.length + (hasNegative ? 1 : 0);
  }, [dataMax, dataMin, yInterval]);

  const yAxisWidth = useMemo(() => {
    const approxCharWidth = 7;
    return clamp(yLabelChars * approxCharWidth + 12, 40, 70);
  }, [yLabelChars]);

  const chartMargins = useMemo(() => {
    const width = chartSize.width || 320;
    const height = chartSize.height || 300;
    const side = clamp(Math.round(width * 0.02), 6, 14);
    const top = clamp(Math.round(height * 0.05), 8, 16);
    const bottom = clamp(Math.round(height * 0.09), 16, 28);
    return { top, right: side, left: side, bottom };
  }, [chartSize.height, chartSize.width]);

  const targetYTicks = useMemo(() => {
    const available = (chartSize.height || 300) - chartMargins.top - chartMargins.bottom;
    return pickTickCount(available, 28);
  }, [chartMargins.bottom, chartMargins.top, chartSize.height]);

  const targetXTicks = useMemo(() => {
    const width = chartSize.width || 320;
    const available = width - yAxisWidth - chartMargins.left - chartMargins.right;
    const rangeMs = timeMax - timeMin;
    const usesTime = Number.isFinite(rangeMs) && rangeMs / 8 < 24 * 60 * 60 * 1000;
    const labelWidth = usesTime ? 88 : 60;
    return pickTickCount(available, labelWidth + 10);
  }, [chartMargins.left, chartMargins.right, chartSize.width, timeMax, timeMin, yAxisWidth]);

  const yAutoConfig = useMemo(() => {
    if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) return { domain: ['dataMin', 'dataMax'] as AxisDomain, ticks: undefined as number[] | undefined };
    const range = dataMax - dataMin;
    const step = niceStep(range === 0 ? 1 : range, targetYTicks);
    const niceMin = range === 0 ? dataMin - step : Math.floor(dataMin / step) * step;
    const niceMax = range === 0 ? dataMax + step : Math.ceil(dataMax / step) * step;
    const ticks = buildTicks(niceMin, niceMax, step);
    return { domain: [niceMin, niceMax] as AxisDomain, ticks };
  }, [dataMax, dataMin, targetYTicks]);

  const xAutoConfig = useMemo(() => {
    if (!Number.isFinite(timeMin) || !Number.isFinite(timeMax) || timeMax <= timeMin) return { domain: ['dataMin', 'dataMax'] as AxisDomain, ticks: undefined as number[] | undefined, stepMs: TIME_STEPS_MS[0] };
    const range = timeMax - timeMin;
    const stepMs = pickTimeStep(range, targetXTicks);
    const niceMin = Math.floor(timeMin / stepMs) * stepMs;
    const niceMax = Math.ceil(timeMax / stepMs) * stepMs;
    const ticks = buildTicks(niceMin, niceMax, stepMs);
    return { domain: [niceMin, niceMax] as AxisDomain, ticks, stepMs };
  }, [targetXTicks, timeMax, timeMin]);

  const yDomain = useMemo<AxisDomain>(() => {
    if (yAuto) return yAutoConfig.domain;
    return [yMin ?? 'dataMin', yMax ?? 'dataMax'] as AxisDomain;
  }, [yAuto, yAutoConfig.domain, yMin, yMax]);

  const xDomain = useMemo<AxisDomain>(() => {
    if (xAuto) return xAutoConfig.domain;
    return [xStart ?? 'dataMin', xEnd ?? 'dataMax'] as AxisDomain;
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
    if (xIntervalMs === undefined) return undefined;
    if (xIntervalMs <= 0) return undefined;
    const minValue = xStart ?? timeMin;
    const maxValue = xEnd ?? timeMax;
    return buildTicks(minValue, maxValue, xIntervalMs);
  }, [timeMax, timeMin, xAuto, xAutoConfig.ticks, xEnd, xIntervalMs, xStart]);

  const xLabelFormat = useMemo(() => {
    if (xAuto) return xAutoConfig.stepMs >= 24 * 60 * 60 * 1000 ? 'MMM d' : 'MMM d, h:mm a';
    if (xIntervalMs !== undefined && xIntervalMs < 24 * 60 * 60 * 1000) return 'MMM d, h:mm a';
    return 'MMM d';
  }, [xAuto, xAutoConfig.stepMs, xIntervalMs]);

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
    const nextXIntervalMs = xIntervalInput.trim() === '' ? undefined : Number(xIntervalInput);

    if (!xAuto) {
      if ((nextXStart && Number.isNaN(nextXStart.getTime())) || (nextXEnd && Number.isNaN(nextXEnd.getTime()))) {
        alert('Dates must be valid or left blank for auto.');
        return;
      }
      if (nextXStart && nextXEnd && nextXEnd <= nextXStart) {
        alert('End date must be after start date.');
        return;
      }
      if (nextXIntervalMs !== undefined && Number.isNaN(nextXIntervalMs)) {
        alert('Interval must be a valid time.');
        return;
      }
      if (nextXIntervalMs !== undefined && nextXIntervalMs <= 0) {
        alert('Interval must be a positive time.');
        return;
      }
    }

    setXStart(nextXStart ? nextXStart.getTime() : undefined);
    setXEnd(nextXEnd ? nextXEnd.getTime() : undefined);
    setXIntervalMs(nextXIntervalMs);
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
      <div ref={containerRef} style={{ width: '100%', height: 300, background: 'white', borderRadius: 16, padding: '12px 0 8px', marginBottom: 16, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 6, right: 8, zIndex: 2 }}>
          <IonButton size="small" fill="clear" onClick={cycleGrid} style={{ fontSize: 11 }}>
            Grid: {gridMode}
          </IonButton>
        </div>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={chartMargins}>
            {gridMode !== 'off' && (
              <CartesianGrid vertical={true} strokeDasharray={gridStyle.strokeDasharray} stroke={gridStyle.stroke} strokeOpacity={gridStyle.strokeOpacity} strokeWidth={gridStyle.strokeWidth} />
            )}
            <XAxis 
                dataKey="time"
                type="number"
                domain={xDomain}
                ticks={xTicks}
                tickLine={false} 
                axisLine={false} 
                tickMargin={clamp(Math.round((chartSize.height || 300) * 0.04), 6, 12)}
                tick={XAxisTick}
                height={clamp(Math.round((chartSize.height || 300) * 0.12), 26, 36)}
                allowDataOverflow={true}
            />
            <YAxis 
                domain={yDomain}
                ticks={yTicks}
                axisLine={false} 
                tickLine={false} 
                width={yAxisWidth}
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
            <IonButtons slot="start">
              <IonButton onClick={() => setIsYAxisModalOpen(false)}>Cancel</IonButton>
            </IonButtons>
            <IonButtons slot="end">
              <IonButton strong onClick={saveYAxisSettings}>Save</IonButton>
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
              <IonLabel>Min</IonLabel>
              <IonInput
                inputMode="decimal"
                value={yMinInput}
                onIonInput={e => setYMinInput(e.detail.value ?? '')}
                disabled={yAuto}
                className="ion-text-right"
              />
            </IonItem>
            <IonItem>
              <IonLabel>Max</IonLabel>
              <IonInput
                inputMode="decimal"
                value={yMaxInput}
                onIonInput={e => setYMaxInput(e.detail.value ?? '')}
                disabled={yAuto}
                className="ion-text-right"
              />
            </IonItem>
            <IonItem>
              <IonLabel>Interval</IonLabel>
              <IonInput
                inputMode="decimal"
                value={yIntervalInput}
                onIonInput={e => setYIntervalInput(e.detail.value ?? '')}
                disabled={yAuto}
                className="ion-text-right"
              />
            </IonItem>
          </IonList>
        </IonContent>
      </IonModal>

      <IonModal isOpen={isXAxisModalOpen} onDidDismiss={() => setIsXAxisModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>X Axis Settings</IonTitle>
            <IonButtons slot="start">
              <IonButton onClick={() => setIsXAxisModalOpen(false)}>Cancel</IonButton>
            </IonButtons>
            <IonButtons slot="end">
              <IonButton strong onClick={saveXAxisSettings}>Save</IonButton>
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
              <IonLabel>Start</IonLabel>
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
              <IonLabel>End</IonLabel>
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
              <IonLabel>Interval</IonLabel>
              <IonSelect
                value={xIntervalInput}
                disabled={xAuto}
                placeholder="Select interval"
                onIonChange={e => setXIntervalInput(e.detail.value ?? '')}
              >
                {X_INTERVAL_OPTIONS.map(option => (
                  <IonSelectOption key={option.ms} value={String(option.ms)}>
                    {option.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </IonList>
        </IonContent>
      </IonModal>
    </>
  );
};

export default MeasurementChart;
