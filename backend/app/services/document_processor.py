import os
import uuid
from pathlib import Path
from typing import List
import pypdf
import pdfplumber
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LangChainDocument
from app.config import get_settings

settings = get_settings()

class DocumentProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(exist_ok=True)
    
    async def save_file(self, file_content: bytes, original_filename: str) -> tuple:
        """Save uploaded file and return file path and unique filename"""
        file_extension = Path(original_filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = self.upload_dir / unique_filename
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        return str(file_path), unique_filename
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            # Try pdfplumber first (better for complex PDFs)
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"pdfplumber failed: {e}, trying pypdf")
            # Fallback to pypdf
            try:
                with open(file_path, 'rb') as file:
                    pdf_reader = pypdf.PdfReader(file)
                    for page in pdf_reader.pages:
                        text += page.extract_text() + "\n"
            except Exception as e:
                print(f"pypdf also failed: {e}")
                raise Exception(f"Failed to extract text from PDF: {e}")
        
        return text.strip()
    
    def process_document(self, file_path: str, filename: str) -> List[LangChainDocument]:
        """Process document and return chunks"""
        # Extract text
        text = self.extract_text_from_pdf(file_path)
        
        if not text:
            raise Exception("No text could be extracted from the document")
        
        # Create document
        doc = LangChainDocument(
            page_content=text,
            metadata={"source": filename, "file_path": file_path}
        )
        
        # Split into chunks
        chunks = self.text_splitter.split_documents([doc])
        
        return chunks
