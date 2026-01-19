import React, { useState, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonInput, IonDatetimeButton, IonDatetime, IonLabel } from '@ionic/react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db';
import { MeasurementEntry } from '../models/Measurement';

interface Props {
  isOpen: boolean;
  onDismiss: () => void;
  typeId: string;
  entryToEdit?: MeasurementEntry;
}

const AddEntryModal: React.FC<Props> = ({ isOpen, onDismiss, typeId, entryToEdit }) => {
  const [value, setValue] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString());

  useEffect(() => {
    if (entryToEdit) {
        setValue(entryToEdit.value?.toString() || '');
        setDate(entryToEdit.date.toISOString());
    } else {
        setValue('');
        setDate(new Date().toISOString());
    }
  }, [entryToEdit, isOpen]);

  const save = async () => {
      const val = value ? parseFloat(value) : undefined;
      const d = new Date(date);
      
      if (entryToEdit) {
          await db.measurementEntries.update(entryToEdit.id, {
              value: val,
              date: d
          });
      } else {
          await db.measurementEntries.add({
              id: uuidv4(),
              typeId,
              date: d,
              value: val
          });
      }
      onDismiss();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
           <IonButtons slot="start"><IonButton onClick={onDismiss}>Cancel</IonButton></IonButtons>
           <IonTitle>{entryToEdit ? 'Edit Entry' : 'Add Entry'}</IonTitle>
           <IonButtons slot="end"><IonButton strong onClick={save}>Save</IonButton></IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent color="light">
         <IonList inset>
            <IonItem>
                <IonInput label="Value" labelPlacement="stacked" type="number" placeholder="Optional" value={value} onIonInput={e => setValue(e.detail.value!)} />
            </IonItem>
            <IonItem>
                 <IonLabel>Time</IonLabel>
                 <IonDatetimeButton datetime="entrytime" />
                 <IonModal keepContentsMounted={true}>
                    <IonDatetime id="entrytime" presentation="date-time" value={date} onIonChange={e => setDate(e.detail.value as string)} />
                 </IonModal>
            </IonItem>
         </IonList>
      </IonContent>
    </IonModal>
  );
};
export default AddEntryModal;
