from fastapi import APIRouter
from app.models import Bus, LocationUpdate
from datetime import datetime

router = APIRouter()

buses = []  # temp list
gps_data = {}  # dict to store latest GPS per bus

@router.post("/add-bus")
def add_bus(bus: Bus):
    buses.append(bus)
    return {"message": "Bus added"}

@router.post("/update-location")
def update_location(data: LocationUpdate):
    data.timestamp = data.timestamp or datetime.now()
    gps_data[data.bus_id] = data
    return {"message": "Location updated"}

@router.get("/buses")
def search_buses(source: str, destination: str):
    matching = []
    for bus in buses:
        if source in bus.route and destination in bus.route and bus.route.index(source) < bus.route.index(destination):
            matching.append(bus)
    return matching
