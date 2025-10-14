import os
from typing import TypedDict, Annotated, List
from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage, AIMessage, BaseMessage
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain_tavily import TavilySearch # UPDATED IMPORT
from langgraph.graph.message import add_messages
import uuid
from app.services.vector_store import VectorStoreManager
from app.config import get_settings
from langgraph.checkpoint.memory import MemorySaver
# Load settings first
settings = get_settings()

# Set environment variables
os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY
os.environ["TAVILY_API_KEY"] = settings.TAVILY_API_KEY

# Initialize vector store
vector_store_manager = VectorStoreManager()

# Initialize Tavily (new package handles API key from environment)
web_search_tool = TavilySearch(max_results=3)
web_search_tool.description = "A search engine useful for finding doctors, clinics, or hospitals in a specific city. Use this to answer any questions about healthcare providers."

class RagQuerySchema(BaseModel):
    query: str = Field(description="A specific medical question to ask the RAG system.")

@tool(args_schema=RagQuerySchema)
def medical_assistant_rag(query: str) -> str:
    """Provides information on general medical topics using a RAG system."""
    try:
        retriever = vector_store_manager.get_retriever(k=3)
        retrieved_docs = retriever.invoke(query)
        
        if not retrieved_docs:
            # Fallback to LLM knowledge
            llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp", temperature=0.3)
            response = llm.invoke(f"Answer this medical question: {query}\n\nAlways end your answer with the disclaimer: 'This information is for educational purposes only and is not a substitute for professional medical advice.'")
            return response.content
        
        context = "\n\n".join([doc.page_content for doc in retrieved_docs])
        final_prompt = f"Using the following context, please answer the user's question.\nContext: {context}\n\nUser's Question: {query}\n\nAlways end your answer with the disclaimer: 'This information is for educational purposes only and is not a substitute for professional medical advice.'"
        
        llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp", temperature=0.3)
        response = llm.invoke(final_prompt)
        return response.content
    except Exception as e:
        # Silent fallback to LLM knowledge
        llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp", temperature=0.3)
        response = llm.invoke(f"Answer this medical question: {query}\n\nAlways end your answer with the disclaimer: 'This information is for educational purposes only and is not a substitute for professional medical advice.'")
        return response.content

class BookAppointmentSchema(BaseModel):
    doctor_name: str = Field(description="The full name of the doctor for the appointment.")
    timeslot: str = Field(description="The chosen date and time for the appointment.")
    patient_name: str = Field(description="The full name of the patient.")
    patient_phone: str = Field(description="The patient's contact phone number.")
    patient_city: str = Field(description="The city where the patient resides.")
    patient_age: int = Field(description="The age of the patient.")

@tool(args_schema=BookAppointmentSchema)
def book_appointment(doctor_name: str, timeslot: str, patient_name: str, patient_phone: str, patient_city: str, patient_age: int) -> str:
    """Simulates booking a doctor's appointment after collecting all necessary patient details."""
    confirmation_id = f"BKNG-{uuid.uuid4().hex[:6].upper()}"
    return f"✅ Appointment Confirmed (Simulation)! \nBooking ID: {confirmation_id}\nPatient: {patient_name}, Age: {patient_age}, City: {patient_city}, Phone: {patient_phone}\nDoctor: {doctor_name}\nTime: {timeslot}"

# State definition
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

# Tools and LLM setup
tools = [web_search_tool, medical_assistant_rag, book_appointment]
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp", temperature=0)
llm_with_tools = llm.bind_tools(tools)

# Agent node
def agent_node(state: AgentState):
    response = llm_with_tools.invoke(state['messages'])
    return {"messages": [response]}

# System prompt
SYSTEM_PROMPT = """You are a helpful Indian medical appointment assistant.
1. Use the 'tavily_search_results_json' tool to find doctors, clinics, or hospitals when a user asks.
2. When a user asks a general medical question (e.g., 'what are the symptoms of a cold?'), use the 'medical_assistant_rag' tool.
3. When a user wants to book an appointment, use the 'book_appointment' tool. You must ask for and collect the patient's name, phone number, city, and age before using this tool.
Be polite and converse naturally. Always provide helpful medical information.
4. if medical_assistant_rag tool is offline then then use tavily search tool answer medical questions.
5. dont say im not a doctor"""

class RAGAgent:
    def __init__(self, db_url: str):
        # Initialize graph
        self.graph_builder = StateGraph(AgentState)
        
        # Add nodes
        self.graph_builder.add_node("agent", agent_node)
        tool_node = ToolNode(tools)
        self.graph_builder.add_node("tools", tool_node)
        
        # Set entry point
        self.graph_builder.set_entry_point("agent")
        
        # Add edges
        self.graph_builder.add_conditional_edges("agent", tools_condition)
        self.graph_builder.add_edge("tools", "agent")
        
        # Compile with PostgreSQL checkpointer (FIXED - use context manager properly)
        self.checkpointer = MemorySaver()
        self.graph = self.graph_builder.compile(checkpointer=self.checkpointer)

        
        # Compile graph
        
    
    def _setup_checkpointer(self):
        """Setup PostgreSQL checkpointer using context manager"""
        # Use context manager to setup and keep reference
        context_manager = PostgresSaver.from_conn_string(self.db_url)
        self.checkpointer = context_manager.__enter__()
        
        # Setup tables (first time only)
        try:
            self.checkpointer.setup()
        except Exception as e:
            # Tables might already exist
            pass
    
    async def chat(self, thread_id: str, user_message: str) -> str:
        config = {"configurable": {"thread_id": thread_id}}
        initial_messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=user_message)]

        final_response = ""
        async for event in self.graph.astream({"messages": initial_messages}, config=config, stream_mode="values"):
            latest_message = event["messages"][-1]
            if isinstance(latest_message, AIMessage) and not latest_message.tool_calls:
                final_response = latest_message.content

        return final_response



