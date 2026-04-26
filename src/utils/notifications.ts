import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Notification } from '../types';

export const notifyUser = async (userId: string, title: string, message: string, type: Notification['type'], link?: string) => {
  try {
    const data: any = {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp()
    };
    if (link) {
      data.link = link;
    }
    await addDoc(collection(db, 'notifications'), data);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'notifications');
  }
};
