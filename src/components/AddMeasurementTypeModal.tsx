import React, { useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonInput, IonLabel, IonDatetimeButton, IonDatetime, IonSegment, IonSegmentButton, IonSelect, IonSelectOption } from '@ionic/react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db';
import { FrequencyType } from '../models/Measurement';

interface Props {
  isOpen: boolean;
  onDismiss: () => void;
}

const AddMeasurementTypeModal: React.FC<Props> = ({ isOpen, onDismiss }) => {
  const [name, setName] = useState('');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('byHour');
  const [hourFrequency, setHourFrequency] = useState<number>(3);
  const [hourStartTime, setHourStartTime] = useState<string>(new Date().toISOString());
  
  // 1=Sun, 7=Sat
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [reminderTime, setReminderTime] = useState<string>(new Date().toISOString());

  const reset = () => {
    setName('');
    setFrequencyType('byHour');
    setHourFrequency(3);
    setSelectedDays([]);
  };

  const save = async () => {
      if (!name) return;

      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

      try {
        await db.measurementTypes.add({
            id: uuidv4(),
            name,
            slug,
            frequencyType,
            hourFrequency: frequencyType === 'byHour' ? hourFrequency : undefined,
            hourStartDate: frequencyType === 'byHour' ? new Date(hourStartTime) : undefined,
            daysOfWeek: frequencyType === 'byDay' ? selectedDays : undefined,
            reminderTime: frequencyType === 'byDay' ? new Date(reminderTime) : undefined,
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
          
          <IonItem lines="none" color="light">
             <IonSegment value={frequencyType} onIonChange={e => setFrequencyType(e.detail.value as FrequencyType)}>
                <IonSegmentButton value="byHour"><IonLabel>By Hour</IonLabel></IonSegmentButton>
                <IonSegmentButton value="byDay"><IonLabel>By Day</IonLabel></IonSegmentButton>
             </IonSegment>
          </IonItem>

          {frequencyType === 'byHour' && (
             <>
               <IonItem>
                 <IonInput label="Every (hours)" labelPlacement="start" type="number" value={hourFrequency} onIonInput={e => setHourFrequency(parseInt(e.detail.value!, 10))} />
               </IonItem>
               <IonItem>
                 <IonLabel>Start Time</IonLabel>
                 <IonDatetimeButton datetime="starttime" />
                 <IonModal keepContentsMounted={true}>
                    <IonDatetime id="starttime" presentation="time" value={hourStartTime} onIonChange={e => setHourStartTime(e.detail.value as string)} />
                 </IonModal>
               </IonItem>
             </>
          )}

          {frequencyType === 'byDay' && (
             <>
                <IonItem>
                    <IonLabel>Days</IonLabel>
                    <IonSelect multiple value={selectedDays} onIonChange={e => setSelectedDays(e.detail.value)}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                            <IonSelectOption key={i} value={i+1}>{day}</IonSelectOption>
                        ))}
                    </IonSelect>
                </IonItem>
                <IonItem>
                 <IonLabel>Reminder</IonLabel>
                 <IonDatetimeButton datetime="remindertime" />
                 <IonModal keepContentsMounted={true}>
                    <IonDatetime id="remindertime" presentation="time" value={reminderTime} onIonChange={e => setReminderTime(e.detail.value as string)} />
                 </IonModal>
               </IonItem>
             </>
          )}
        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default AddMeasurementTypeModal;
