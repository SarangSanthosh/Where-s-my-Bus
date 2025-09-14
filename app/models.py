from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Bus(BaseModel):
    bus_id: str
    name: str
    route: List[str]
    start_time: str  # HH:MM
    end_time: str    # HH:MM

class LocationUpdate(BaseModel):
    bus_id: str
    latitude: float
    longitude: float
    speed_kmph: float
    timestamp: Optional[datetime] = None
