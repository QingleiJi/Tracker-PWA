import React, { useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonInput } from '@ionic/react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db';

interface Props {
  isOpen: boolean;
  onDismiss: () => void;
}

const AddMeasurementTypeModal: React.FC<Props> = ({ isOpen, onDismiss }) => {
  const [name, setName] = useState('');

  const reset = () => {
    setName('');
  };

  const save = async () => {
      if (!name) return;

      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

      try {
        await db.measurementTypes.add({
            id: uuidv4(),
            name,
            slug,
            frequencyType: 'byDay',
        });
        reset();
        onDismiss();
      } catch (error) {
        if ((error as Error).name === 'ConstraintError') {
            alert('A measurement with this name already exists.');
        } else {
            console.error('Failed to save measurement type:', error);
            alert('An unexpected error occurred.');
        }
      }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonButton onClick={onDismiss}>Cancel</IonButton></IonButtons>
          <IonTitle>New Tracker</IonTitle>
          <IonButtons slot="end"><IonButton strong onClick={save}>Add</IonButton></IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent color="light">
        <IonList inset>
          <IonItem>
            <IonInput label="Name" labelPlacement="stacked" placeholder="e.g. Weight" value={name} onIonInput={e => setName(e.detail.value!)} />
          </IonItem>
        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default AddMeasurementTypeModal;
