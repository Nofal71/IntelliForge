import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { saveRAGProjectToFirebase, saveDocumentMetadataToFirestore, storeChunks, getRelevantChunks, getChunksForProjects } from './firebase';
import { sendChatMessage } from './openrouter';

import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();


export const ragService = {

  async parseDocument(file: File): Promise<string> {
    let text = '';
    if (file.type === 'text/plain') {
      text = await file.text();
    } else if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log(`PDF loaded: ${pdf.numPages} pages`);

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        console.log(`Page ${i} text preview:`, pageText.slice(0, 100));
        text += pageText + '\n';
      }
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
    return text;
  },

  async chunkDocument(text: string): Promise<string[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    return splitter.splitText(text);
  },

  async processDocuments(
    userId: string,
    ragProjectId: string,
    files: File[],
  ): Promise<{ documentIds: string[]; totalChunksCount: number } | null> {
    try {
      let totalText = '';
      const texts: string[] = [];

      for (const file of files) {
        const text = await this.parseDocument(file);
        texts.push(text);
        totalText += text;
      }

      const documentIds: string[] = [];
      let totalChunksCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = texts[i];
        const chunks = await this.chunkDocument(text);
        const { documentId } = await saveDocumentMetadataToFirestore(userId, ragProjectId, file.name, file.type);
        const chunksCount = await storeChunks(documentId, chunks);
        documentIds.push(documentId);
        totalChunksCount += chunksCount;
      }

      return { documentIds, totalChunksCount };
    } catch (error) {
      console.error("Document processing failed:", error);
      return null;
    }
  },
  async generateRAGResponse(
    ragProjectIds: string[],
    query: string,
    apiKey: string,
    llmModel: string,
    userId: string,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    let context = '';
    if (ragProjectIds.length) {
      for (const ragProjectId of ragProjectIds) {
        const chunks = await getRelevantChunks(ragProjectId, query, userId);
        context += chunks.map(chunk => chunk.text).join('\n') + '\n';
      }
    }
    const systemPrompt = context ? `Answer based on the provided context:\n${context}` : 'No relevant context found. Answer generally.';
    return sendChatMessage(apiKey, llmModel, [{ role: 'user', content: query }], systemPrompt, onStream);
  },


  saveRAGProjectToFirebase,
  saveDocumentMetadataToFirestore,
  storeChunks,
  getRelevantChunks,
  getChunksForProjects,
};



