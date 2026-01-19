import React from 'react';
import { IonIcon } from '@ionic/react';
import { chevronForward } from 'ionicons/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { MeasurementType } from '../models/Measurement';
import { format } from 'date-fns';

interface Props {
  type: MeasurementType;
}

const MeasurementTypeCard: React.FC<Props> = ({ type }) => {
  const latestEntry = useLiveQuery(
    () => db.measurementEntries
      .where('typeId')
      .equals(type.id)
      .reverse()
      .sortBy('date')
      .then(entries => entries[0])
  , [type.id]);

  return (
    <div className="scandi-card">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="scandi-title">{type.name}</div>
        <div className="scandi-subtitle">
          {latestEntry ? (
            <>
              <span>Latest: </span>
              {latestEntry.value !== undefined ? (
                <span style={{ color: 'var(--ion-text-color)', fontWeight: 500 }}>
                  {latestEntry.value.toFixed(2)}
                </span>
              ) : (
                <span style={{ color: 'var(--ion-text-color)', fontWeight: 500 }}>
                  {format(latestEntry.date, 'p')}
                </span>
              )}
            </>
          ) : (
            <span>No entries yet</span>
          )}
        </div>
      </div>
      <IonIcon icon={chevronForward} style={{ color: 'var(--ion-color-medium)', opacity: 0.5 }} />
    </div>
  );
};
export default MeasurementTypeCard;
