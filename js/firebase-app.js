/*
  =====================================================================
  FIREBASE + CLOUDINARY — real account records + real photo uploads.

  Firestore (Firebase) stores lightweight data: member records and
  photo metadata (caption, uploader, URL). It's free on Firebase's
  Spark plan with no credit card required.

  Cloudinary stores the actual image files. As of 2026, Firebase
  Storage requires linking a credit card (Google's "Blaze" plan) even
  for free-tier usage — so this uses Cloudinary instead, which has a
  genuine free-forever tier with no credit card needed, built exactly
  for unsigned, backend-free browser uploads like this one.

  Loaded as ES modules from Google's CDN, so there's no build step.

  IMPORTANT SECURITY NOTE (read this before relying on it):
  There is no server here, so nothing in this file can *cryptographically
  prove* to Firestore or Cloudinary that a write really came from a
  logged-in Discord user — it can only check that in the browser, which
  a determined person could bypass by calling those APIs directly with
  your project's public keys (which are always visible in any
  client-side app). The Firestore rules in the README restrict what any
  writer can do (e.g. no editing someone else's record) but can't
  verify *who* is writing without adding a small server-side piece
  later. This is the same class of trade-off as the Discord webhook
  elsewhere in this project — reasonable for a hobby/community site,
  not bank-grade.
  =====================================================================
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit,
  getDocs, getCountFromServer, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let app, db, firebaseReady = false;

function firebaseConfigured() {
  return SITE_CONFIG.firebaseConfig &&
    !String(SITE_CONFIG.firebaseConfig.apiKey || '').includes('PASTE_YOUR');
}

function cloudinaryConfigured() {
  return SITE_CONFIG.cloudinary &&
    !String(SITE_CONFIG.cloudinary.cloudName || '').includes('PASTE_YOUR') &&
    !String(SITE_CONFIG.cloudinary.uploadPreset || '').includes('PASTE_YOUR');
}

if (firebaseConfigured()) {
  try {
    app = initializeApp(SITE_CONFIG.firebaseConfig);
    db = getFirestore(app);
    firebaseReady = true;
  } catch (err) {
    console.error('Firebase failed to initialize:', err);
  }
}

// ---------- Record / update a member when they log in with Discord ----------
export async function recordMember(discordUser) {
  if (!firebaseReady) return null;
  const userRef = doc(db, 'members', discordUser.id);
  const existing = await getDoc(userRef);

  const data = {
    discordId: discordUser.id,
    username: discordUser.username,
    avatar: discordUser.avatar || null,
    lastLogin: serverTimestamp()
  };
  if (!existing.exists()) {
    data.joinedAt = serverTimestamp();
  }
  await setDoc(userRef, data, { merge: true });
  return existing.exists() ? 'updated' : 'created';
}

// ---------- Sidebar stats: real member count + newest member ----------
export async function getMemberStats() {
  if (!firebaseReady) return null;
  const membersCol = collection(db, 'members');
  const countSnap = await getCountFromServer(membersCol);
  const newestQ = query(membersCol, orderBy('joinedAt', 'desc'), limit(1));
  const newestSnap = await getDocs(newestQ);
  let newest = null;
  newestSnap.forEach(d => { newest = d.data(); });
  return {
    totalMembers: countSnap.data().count,
    newestMember: newest
  };
}

// ---------- Gallery: list photos ----------
export async function listPhotos(max = 24) {
  if (!firebaseReady) return [];
  const photosCol = collection(db, 'photos');
  const q = query(photosCol, orderBy('uploadedAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  const photos = [];
  snap.forEach(d => photos.push({ id: d.id, ...d.data() }));
  return photos;
}

// ---------- Gallery: upload a photo (file goes to Cloudinary, metadata to Firestore) ----------
export async function uploadPhoto(file, caption, discordUser) {
  if (!discordUser) throw new Error('You must be logged in with Discord to upload.');
  if (!cloudinaryConfigured()) throw new Error('Photo storage is not configured yet (see js/config.js).');
  if (!firebaseReady) throw new Error('Firebase is not configured yet (see js/config.js).');

  const MAX_BYTES = 8 * 1024 * 1024; // 8MB
  if (file.size > MAX_BYTES) throw new Error('Image is too large (max 8MB).');
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed.');

  // 1. Upload the actual image file straight to Cloudinary (no backend needed —
  //    "unsigned" upload presets are designed for exactly this).
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', SITE_CONFIG.cloudinary.uploadPreset);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${SITE_CONFIG.cloudinary.cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => '');
    throw new Error(`Image upload failed (${uploadRes.status}). ${errText.slice(0, 150)}`);
  }
  const uploadData = await uploadRes.json();
  const url = uploadData.secure_url;

  // 2. Record the lightweight metadata (who uploaded it, caption, url) in Firestore.
  const photosCol = collection(db, 'photos');
  const photoDoc = doc(photosCol);
  await setDoc(photoDoc, {
    url,
    caption: caption || '',
    uploaderDiscordId: discordUser.id,
    uploaderUsername: discordUser.username,
    uploadedAt: serverTimestamp()
  });

  return url;
}

export function isFirebaseReady() {
  return firebaseReady;
}

export function isCloudinaryReady() {
  return cloudinaryConfigured();
}
