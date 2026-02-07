from sqlalchemy import Column, Integer, String, DateTime, BigInteger
from sqlalchemy.orm import relationship
import datetime
from app.database import Base

class PaymeTransaction(Base):
    """Модель для хранения транзакций Payme Merchant API"""
    __tablename__ = "payme_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True)  # ID транзакции от Payme
    order_id = Column(Integer, index=True)  # ID заказа
    amount = Column(BigInteger)  # Сумма в тийинах
    state = Column(Integer, default=0)  # Состояние транзакции: 0-создана, 1-завершена, -1-отменена
    create_time = Column(BigInteger)  # Unix timestamp создания
    perform_time = Column(BigInteger, nullable=True)  # Unix timestamp выполнения
    cancel_time = Column(BigInteger, nullable=True)  # Unix timestamp отмены
    reason = Column(Integer, nullable=True)  # Причина отмены
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
