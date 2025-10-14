import os
import chromadb
from chromadb.config import Settings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from typing import List
from langchain_core.documents import Document
from app.config import get_settings

settings = get_settings()

class VectorStoreManager:
    def __init__(self):
        # Ensure API key is set
        if not os.getenv('GOOGLE_API_KEY'):
            os.environ['GOOGLE_API_KEY'] = settings.GOOGLE_API_KEY
        
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=settings.GOOGLE_API_KEY  # Explicitly pass API key
        )
        self.persist_directory = settings.CHROMA_DB_DIR
        
        # Initialize Chroma client
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        
        # Initialize vector store
        self.vector_store = Chroma(
            client=self.client,
            collection_name="medical_documents",
            embedding_function=self.embeddings,
        )
    
    def add_documents(self, documents: List[Document]):
        """Add documents to vector store"""
        self.vector_store.add_documents(documents)
    
    def get_retriever(self, k: int = 3):
        """Get retriever for RAG"""
        return self.vector_store.as_retriever(search_kwargs={"k": k})
    
    def similarity_search(self, query: str, k: int = 3):
        """Perform similarity search"""
        return self.vector_store.similarity_search(query, k=k)
