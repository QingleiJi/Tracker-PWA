import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton, IonIcon } from '@ionic/react';
import { add } from 'ionicons/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import MeasurementTypeCard from '../components/MeasurementTypeCard';
import AddMeasurementTypeModal from '../components/AddMeasurementTypeModal';
import { useHistory } from 'react-router-dom';

const Home: React.FC = () => {
  const measurementTypes = useLiveQuery(() => db.measurementTypes.toArray());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Tracker</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen color="light">
        <IonHeader collapse="condense">
          <IonToolbar color="light">
            <IonTitle size="large">Tracker</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div style={{ padding: '16px' }}>
            {measurementTypes?.map(type => (
                <div key={type.id} onClick={() => history.push(`/measurement/${type.id}`)}>
                    <MeasurementTypeCard type={type} />
                </div>
            ))}
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
