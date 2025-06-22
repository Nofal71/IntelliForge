import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  arrayUnion,
  writeBatch,
  query,
  where,
  DocumentReference,
  CollectionReference,
  Query,
} from 'firebase/firestore';
import type { Chat, Chunk, Document, RAGProject, UserData } from '../types';
import { nanoid } from '@reduxjs/toolkit';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};


const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;
const API_URL =
  "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const saveUserData = async (userData: UserData) => {
  if (!userData.uid) throw new Error('Invalid user ID');
  await setDoc(doc(db, 'users', userData.uid), userData, { merge: true });
};

export const getUserData = async (uid: string): Promise<UserData | null> => {
  if (!uid) return null;
  const docSnap = await getDoc(doc(db, 'users', uid));
  return docSnap.exists() ? (docSnap.data() as UserData) : null;
};

export const saveChat = async (uid: string, chat: Chat) => {
  if (!uid || !chat.id) throw new Error('Invalid user ID or chat ID');
  await setDoc(doc(db, 'users', uid, 'chats', chat.id), chat);
};

export const deleteChat = async (uid: string, chatId: string) => {
  if (!uid || !chatId) throw new Error('Invalid user ID or chat ID');
  await deleteDoc(doc(db, 'users', uid, 'chats', chatId));
};

export const getChat = async (uid: string, chatId: string): Promise<Chat | null> => {
  if (!uid || !chatId) return null;
  const docSnap = await getDoc(doc(db, 'users', uid, 'chats', chatId));
  return docSnap.exists() ? (docSnap.data() as Chat) : null;
};

export const getChats = async (uid: string): Promise<Chat[]> => {
  if (!uid) return [];
  const querySnapshot = await getDocs(collection(db, 'users', uid, 'chats'));
  return querySnapshot.docs.map(doc => doc.data() as Chat);
};

export const updateChat = async (uid: string, chatId: string, chat: Chat) => {
  if (!uid || !chatId) throw new Error('Invalid user ID or chat ID');
  await setDoc(doc(db, 'users', uid, 'chats', chatId), chat, { merge: true });
};


export const updateChatTitle = async (uid: string, chatId: string, title: string) => {
  if (!uid || !chatId || !title) throw new Error('Invalid user ID, chat ID, or title');
  try {
    await setDoc(doc(db, 'users', uid, 'chats', chatId), { title }, { merge: true });
  } catch (error) {
    console.error('Error updating chat title:', error);
    throw error;
  }
};


export const saveRAGProjectToFirebase = async (userId: string, name: string): Promise<{ ragProjectId: string; name: string }> => {
  if (!userId || !name) throw new Error('User ID and name required');
  const ragProjectId = nanoid();
  const projectRef: DocumentReference = doc(db, 'ragProjects', ragProjectId);
  const projectData: RAGProject = {
    ragProjectId,
    name,
    userId,
    createdAt: new Date().toISOString(),
    documentIds: [],
  };
  await setDoc(projectRef, projectData);
  return { ragProjectId, name };
};

export const saveDocumentMetadataToFirestore = async (userId: string, ragProjectId: string, fileName: string, fileType: string): Promise<{ documentId: string }> => {
  if (!userId || !ragProjectId || !fileName || !fileType) throw new Error('User ID, project ID, file name, type required');
  const allowedTypes = ['text/plain', 'application/pdf'];
  if (!allowedTypes.includes(fileType)) throw new Error('Unsupported file type');

  const docId = nanoid();
  const docRef: DocumentReference = doc(db, 'documents', docId);
  const docData: Document = {
    documentId: docId,
    ragProjectId,
    userId,
    fileName,
    fileType,
    createdAt: new Date().toISOString(),
  };
  await setDoc(docRef, docData);

  const projectRef: DocumentReference = doc(db, 'ragProjects', ragProjectId);
  await updateDoc(projectRef, {
    documentIds: arrayUnion(docId),
  });

  return { documentId: docId };
};


export async function generateEmbedding(text: string) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  return await response.json()
}

export const storeChunks = async (documentId: string, chunks: string[]): Promise<number> => {
  if (!documentId || !chunks.length) throw new Error('Document ID and chunks required');

  const batch = writeBatch(db);

  for (let index = 0; index < chunks.length; index++) {
    const text = chunks[index];
    const chunkId = nanoid();
    const chunkRef: DocumentReference = doc(db, 'documents', documentId, 'chunks', chunkId);
    const embedding = await generateEmbedding(text);
    const chunkData: Chunk = {
      chunkId,
      text,
      documentId,
      index,
      embedding,
    };
    batch.set(chunkRef, chunkData);
  }

  await batch.commit();
  return chunks.length;
};


export const getRelevantChunks = async (ragProjectId: string, queryText: string, userId: string): Promise<{ text: string; similarity: number }[]> => {
  if (!ragProjectId || !queryText || !userId) throw new Error('Project ID, query, and user ID required');
  const queryEmbedding = await generateEmbedding(queryText);
  const chunks: { text: string; similarity: number }[] = [];
  const docsQuery: Query = query(collection(db, 'documents'), where('ragProjectId', '==', ragProjectId), where('userId', '==', userId));
  const docsSnapshot = await getDocs(docsQuery);
  for (const docSnap of docsSnapshot.docs) {
    const chunksCollection: CollectionReference = collection(db, 'documents', docSnap.id, 'chunks');
    const chunksSnapshot = await getDocs(chunksCollection);
    chunksSnapshot.forEach(chunkDoc => {
      const chunk = chunkDoc.data() as Chunk;
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      chunks.push({ text: chunk.text, similarity });
    });
  }

  return chunks.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
};

export const getChunksForProjects = async (ragProjectIds: string[], userId: string): Promise<{ chunkId: string; text: string; documentId: string }[]> => {
  if (!ragProjectIds.length || !userId) return [];
  const chunks: { chunkId: string; text: string; documentId: string }[] = [];
  const docsQuery: Query = query(collection(db, 'documents'), where('ragProjectId', 'in', ragProjectIds), where('userId', '==', userId));
  const docsSnapshot = await getDocs(docsQuery);
  for (const docSnap of docsSnapshot.docs) {
    const chunksCollection: CollectionReference = collection(db, 'documents', docSnap.id, 'chunks');
    const chunksSnapshot = await getDocs(chunksCollection);
    chunksSnapshot.forEach(chunkDoc => {
      const chunk = chunkDoc.data() as Chunk;
      chunks.push({ chunkId: chunk.chunkId, text: chunk.text, documentId: chunk.documentId });
    });
  }
  return chunks;
};

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB) || 0;
}


export const deleteRAGProject = async (userId: string, ragProjectId: string): Promise<void> => {
  if (!userId || !ragProjectId) throw new Error('User ID and project ID required');

  const projectRef: DocumentReference = doc(db, 'ragProjects', ragProjectId);
  const projectSnap = await getDoc(projectRef);
  if (!projectSnap.exists()) throw new Error('Project not found');
  const projectData = projectSnap.data() as RAGProject;
  if (projectData.userId !== userId) throw new Error('Unauthorized: Project does not belong to user');

  const batch = writeBatch(db);
  batch.delete(projectRef);

  const docsQuery: Query = query(
    collection(db, 'documents'),
    where('ragProjectId', '==', ragProjectId),
    where('userId', '==', userId)
  );
  const docsSnapshot = await getDocs(docsQuery);
  for (const docSnap of docsSnapshot.docs) {
    const documentId = docSnap.id;
    const docRef: DocumentReference = doc(db, 'documents', documentId);
    batch.delete(docRef);
    const chunksCollection: CollectionReference = collection(db, 'documents', documentId, 'chunks');
    const chunksSnapshot = await getDocs(chunksCollection);
    chunksSnapshot.forEach(chunkDoc => {
      batch.delete(chunkDoc.ref);
    });
  }

  await batch.commit();
};
