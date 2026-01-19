import React, { useState, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton, IonIcon, IonButtons, IonButton, IonList, IonItemSliding, IonItem, IonItemOptions, IonItemOption } from '@ionic/react';
import { add, download, cloudUpload, trash } from 'ionicons/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import MeasurementTypeCard from '../components/MeasurementTypeCard';
import AddMeasurementTypeModal from '../components/AddMeasurementTypeModal';
import { useHistory } from 'react-router-dom';
import { exportData, importData } from '../services/DataService';

const Home: React.FC = () => {
  const measurementTypes = useLiveQuery(() => db.measurementTypes.toArray());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const history = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await exportData();
    } catch (error) {
      alert('Failed to export data');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importData(file);
        alert('Data imported successfully');
        // Clear the input so the same file can be selected again if needed
        event.target.value = '';
      } catch (error) {
        alert('Failed to import data');
      }
    }
  };

  const deleteMeasurementType = async (typeId: string) => {
    if (window.confirm('Are you sure you want to delete this measurement type? All associated entries will be lost.')) {
        try {
            await db.transaction('rw', db.measurementTypes, db.measurementEntries, async () => {
                await db.measurementEntries.where('typeId').equals(typeId).delete();
                await db.measurementTypes.delete(typeId);
            });
        } catch (error) {
            console.error('Failed to delete measurement type:', error);
            alert('Failed to delete measurement type');
        }
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Tracker</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleExport}>
              <IonIcon slot="icon-only" icon={download} />
            </IonButton>
            <IonButton onClick={handleImportClick}>
              <IonIcon slot="icon-only" icon={cloudUpload} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen color="light">
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <IonHeader collapse="condense">
          <IonToolbar color="light">
            <IonTitle size="large">Tracker</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div style={{ padding: '16px' }}>
            <IonList style={{ background: 'transparent', padding: 0 }}>
                {measurementTypes?.map(type => (
                    <IonItemSliding key={type.id} style={{ marginBottom: '12px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                        <IonItem
                            lines="none"
                            style={{ '--background': 'transparent', '--padding-start': 0, '--inner-padding-end': 0 }}
                            button
                            detail={false}
                            onClick={() => history.push(`/${type.slug}`)}
                        >
                            <MeasurementTypeCard 
                                type={type} 
                                style={{ marginBottom: 0, width: '100%', boxShadow: 'none' }} 
                            />
                        </IonItem>
                        <IonItemOptions side="end">
                            <IonItemOption color="danger" onClick={() => deleteMeasurementType(type.id)}>
                                <IonIcon slot="icon-only" icon={trash} />
                            </IonItemOption>
                        </IonItemOptions>
                    </IonItemSliding>
                ))}
            </IonList>
        </div>

        <AddMeasurementTypeModal isOpen={isModalOpen} onDismiss={() => setIsModalOpen(false)} />
        
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setIsModalOpen(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};
export default Home;
