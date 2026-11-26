import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export const ADMIN_UID = 'aBlTShPkDvbT1GQ4Du0Vk3DBtEW2';

export const ENQUIRY_COLLECTION = 'enquiries';

export const ENQUIRY_STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
];

export const ENQUIRY_LIMITS = {
  name: { min: 2, max: 100, label: 'Name' },
  contact: { min: 5, max: 120, label: 'Phone or Email' },
  topic: { min: 2, max: 80, label: 'Topic' },
  message: { min: 5, max: 2000, label: 'Message' },
};

/**
 * Validate and normalize a customer enquiry payload to match firestore.rules bounds.
 */
export function validateEnquiryInput({ name, contact, topic, message }) {
  const normalized = {
    name: typeof name === 'string' ? name.trim() : '',
    contact: typeof contact === 'string' ? contact.trim() : '',
    topic: typeof topic === 'string' ? topic.trim() : '',
    message: typeof message === 'string' ? message.trim() : '',
  };

  for (const [field, rules] of Object.entries(ENQUIRY_LIMITS)) {
    const len = normalized[field].length;
    if (len < rules.min) {
      throw new Error(`${rules.label} must be at least ${rules.min} characters.`);
    }
    if (len > rules.max) {
      throw new Error(`${rules.label} must be under ${rules.max} characters.`);
    }
  }

  return normalized;
}

/**
 * Persist a new customer enquiry in Firestore with server timestamp and strict schema fields.
 */
export async function submitEnquiry(formInput) {
  const validated = validateEnquiryInput(formInput);

  const docRef = await addDoc(collection(db, ENQUIRY_COLLECTION), {
    name: validated.name,
    contact: validated.contact,
    topic: validated.topic,
    message: validated.message,
    status: 'new',
    source: 'website',
    createdAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    ...validated,
    status: 'new',
    source: 'website',
  };
}

/**
 * Subscribe to real-time customer enquiries sorted newest first (admin-only per firestore.rules).
 */
export function subscribeEnquiries(onData, onError) {
  const q = query(
    collection(db, ENQUIRY_COLLECTION),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((snap) => ({
        id: snap.id,
        ...snap.data(),
      }));
      onData(items);
    },
    onError,
  );
}

/**
 * Update the workflow status of an existing enquiry document.
 */
export async function updateEnquiryStatus(enquiryId, nextStatus) {
  const allowed = ENQUIRY_STATUSES.some((item) => item.id === nextStatus);
  if (!allowed) {
    throw new Error('Invalid enquiry status.');
  }
  await updateDoc(doc(db, ENQUIRY_COLLECTION, enquiryId), {
    status: nextStatus,
  });
}

/**
 * Permanently remove an enquiry document from Firestore.
 */
export async function deleteEnquiry(enquiryId) {
  await deleteDoc(doc(db, ENQUIRY_COLLECTION, enquiryId));
}
