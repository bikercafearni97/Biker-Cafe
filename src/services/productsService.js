/**
 * Firestore service for showroom products (admin CRUD + public read).
 *
 * Collection: showroomProducts
 * Fields per document:
 *   id            – string  (Firestore auto-id used as document id)
 *   slotCode      – string  e.g. "AXOR // 01"
 *   brand         – string
 *   category      – string
 *   title         – string
 *   subtitle      – string
 *   summary       – string
 *   priceLabel    – string  e.g. "₹5,498"
 *   referenceNote – string
 *   image         – string  (URL)
 *   certification – string
 *   shellSpec     – string
 *   weightSpec    – string
 *   visorSpec     – string
 *   ventilationSpec – string
 *   retentionSpec – string
 *   fitNote       – string
 *   highlights    – string[]
 *   accentColor   – string  hex
 *   previewFinish – string  finish id
 *   visible       – boolean
 *   order         – number
 *   updatedAt     – timestamp
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export const PRODUCTS_COLLECTION = 'showroomProducts';

/**
 * Fetch only visible products for public showroom, sorted by order.
 */
export async function getPublicProducts() {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('visible', '==', true),
    orderBy('order', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch ALL products (visible and hidden) — admin only.
 */
export async function getAllProducts() {
  const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Add a new product document.
 * @param {object} data  Product fields (without id).
 */
export async function addProduct(data) {
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update an existing product document.
 * @param {string} productId  Firestore document id.
 * @param {object} data       Fields to update.
 */
export async function updateProduct(productId, data) {
  await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a product document.
 * @param {string} productId  Firestore document id.
 */
export async function deleteProduct(productId) {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
}

/**
 * Seed the showroomProducts collection with an array of initial products.
 * Only adds documents that do not already exist (checks collection size first).
 * @param {object[]} products  Products from SHOWROOM_SLOTS (static seed data).
 * @returns {number} Number of documents written.
 */
export async function seedProductsIfEmpty(products) {
  const existing = await getDocs(collection(db, PRODUCTS_COLLECTION));
  if (!existing.empty) {
    return 0; // Already seeded
  }

  const batch = writeBatch(db);
  products.forEach((p, index) => {
    const ref = doc(collection(db, PRODUCTS_COLLECTION));
    // eslint-disable-next-line no-unused-vars
    const { id: _staticId, ...rest } = p; // drop static JS id; Firestore generates its own
    batch.set(ref, {
      ...rest,
      visible: true,
      order: index,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  return products.length;
}
