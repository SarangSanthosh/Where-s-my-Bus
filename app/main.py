from fastapi import FastAPI, Query
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import pytz
import requests

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase config
SUPABASE_URL = "https://ebjlrvevjnhxptsqnvbi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViamxydmV2am5oeHB0c3FudmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Njc5MjUsImV4cCI6MjA2NDU0MzkyNX0.MKrzSfB3IrGdHDbiLkgUk2C6zmDfH1ot7Uvay-wCb8M"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Google Maps API Key
GOOGLE_MAPS_API_KEY = "AIzaSyBW-qg_iQkuBMC_1BmilF2RC_OCNiCeF2I"

# Convert location to coordinates
def geocode_location(place_name: str):
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": place_name, "key": GOOGLE_MAPS_API_KEY}
    response = requests.get(url, params=params)
    data = response.json()
    if data["status"] == "OK":
        location = data["results"][0]["geometry"]["location"]
        return f"{location['lat']},{location['lng']}"
    return None

@app.get("/buses")
def get_buses(source: str = Query(...), destination: str = Query(...)):
    ist = pytz.timezone("Asia/Kolkata")
    now_ist = datetime.now(ist)

    # Fetch buses
    result = supabase.table("bus_details") \
        .select("*") \
        .eq("source_station", source) \
        .eq("destination_station", destination) \
        .execute()

    buses = result.data

    for bus in buses:
        lat = bus.get("current_lat")
        lng = bus.get("current_lng")
        src = bus.get("source_station")
        dest = bus.get("destination_station")
        bus_name = bus.get("bus_name")

        print(f"\n🚌 Bus Name: {bus_name}")
        print(f"🕓 Now IST: {now_ist.strftime('%Y-%m-%d %H:%M:%S')}")

        src_coords = geocode_location(src)
        dest_coords = geocode_location(dest)

        if lat is not None and lng is not None and src_coords and dest_coords:
            maps_url = "https://maps.googleapis.com/maps/api/distancematrix/json"

            # 1. Duration from current location to source
            params_to_source = {
                "origins": f"{lat},{lng}",
                "destinations": src_coords,
                "departure_time": "now",
                "key": GOOGLE_MAPS_API_KEY
            }
            response_to_source = requests.get(maps_url, params=params_to_source)
            data_src = response_to_source.json()

            # 2. Duration from source to destination
            params_src_to_dest = {
                "origins": src_coords,
                "destinations": dest_coords,
                "departure_time": "now",
                "key": GOOGLE_MAPS_API_KEY
            }
            response_src_dest = requests.get(maps_url, params=params_src_to_dest)
            data_dest = response_src_dest.json()

            try:
                duration_to_source = data_src["rows"][0]["elements"][0]["duration"]["value"]
                duration_src_to_dest = data_dest["rows"][0]["elements"][0]["duration"]["value"]

                eta_src_dt = now_ist + timedelta(seconds=duration_to_source)
                eta_dest_dt = eta_src_dt + timedelta(seconds=duration_src_to_dest)

                print(f"🟢 Duration to Source: {duration_to_source // 60} min")
                print(f"🟢 Duration Source to Destination: {duration_src_to_dest // 60} min")
                print(f"📍 ETA at Source: {eta_src_dt.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"📍 ETA at Destination: {eta_dest_dt.strftime('%Y-%m-%d %H:%M:%S')}")

                if bus_name == "Greenline Deluxe":
                    update_resp = supabase.table("bus_details").update({
                        "arrival_at_source": eta_src_dt.isoformat(),
                        "expected_arrival_at_dest": eta_dest_dt.isoformat()
                    }).eq("bus_name", "Greenline Deluxe").execute()

                    bus["update_status"] = getattr(update_resp, "status_code", "unknown")
                    bus["update_result"] = update_resp.data if hasattr(update_resp, "data") else "No data returned"
                    print("✅ Supabase updated for Greenline Deluxe.")

                # Attach human-readable ETA
                bus["eta_text_source"] = data_src["rows"][0]["elements"][0]["duration"]["text"]
                bus["eta_text_src_to_dest"] = data_dest["rows"][0]["elements"][0]["duration"]["text"]
                bus["eta_text_destination"] = f"{bus['eta_text_source']} + {bus['eta_text_src_to_dest']}"
                bus["calculated_eta_source"] = eta_src_dt.isoformat()
                bus["calculated_eta_dest"] = eta_dest_dt.isoformat()

            except Exception as e:
                print(f"❌ Error for Bus Name {bus_name}: {str(e)}")
                bus["eta_text_source"] = "Error"
                bus["eta_text_src_to_dest"] = "Error"
                bus["calculated_eta_source"] = "Unavailable"
                bus["calculated_eta_dest"] = "Unavailable"
                bus["error"] = str(e)

    return {"buses": buses}
