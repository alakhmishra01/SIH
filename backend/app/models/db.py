from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.database import Base

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(100), index=True, nullable=False)
    type = Column(String(50), nullable=False)  # 'recommendation' or 'yield_prediction'
    input_data = Column(Text, nullable=False)   # JSON string
    result_data = Column(Text, nullable=False)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
