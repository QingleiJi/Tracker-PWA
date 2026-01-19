import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonBackButton, IonList, IonItem, IonIcon, IonFab, IonFabButton, IonButton } from '@ionic/react';
import { add, trash } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { format } from 'date-fns';
import MeasurementChart from '../components/MeasurementChart';
import AddEntryModal from '../components/AddEntryModal';
import { MeasurementEntry } from '../models/Measurement';

const MeasurementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const type = useLiveQuery(() => db.measurementTypes.get(id), [id]);
  const entries = useLiveQuery(() => db.measurementEntries.where('typeId').equals(id).reverse().sortBy('date'), [id]);

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<MeasurementEntry | undefined>(undefined);

  const deleteEntry = (entryId: string) => {
      db.measurementEntries.delete(entryId);
  };

  if (!type) return <IonPage><IonContent>Loading...</IonContent></IonPage>;

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{type.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen color="light">
         <IonHeader collapse="condense">
          <IonToolbar color="light">
            <IonTitle size="large">{type.name}</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <div style={{ padding: 16 }}>
           <MeasurementChart entries={entries || []} />
        </div>

        <IonList inset>
            {entries?.map(entry => (
                <IonItem key={entry.id} button onClick={() => { setEntryToEdit(entry); setIsEntryModalOpen(true); }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 17, fontWeight: 500, color: 'var(--ion-text-color)' }}>
                                {entry.value !== undefined ? entry.value : 'Entry'}
                            </span>
                            <span style={{ fontSize: 14, color: 'var(--ion-color-medium)', marginTop: 4 }}>
                                {format(entry.date, 'MMM d, h:mm a')}
                            </span>
                        </div>
                        <IonButton fill="clear" color="medium" onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}>
                             <IonIcon icon={trash} slot="icon-only" />
                        </IonButton>
                    </div>
                </IonItem>
            ))}
        </IonList>

        <AddEntryModal 
            isOpen={isEntryModalOpen} 
            onDismiss={() => { setIsEntryModalOpen(false); setEntryToEdit(undefined); }} 
            typeId={id} 
            entryToEdit={entryToEdit}
        />

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => { setEntryToEdit(undefined); setIsEntryModalOpen(true); }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};
export default MeasurementDetail;
