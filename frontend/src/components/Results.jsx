import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";

export default function Results() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const source = searchParams.get("source");
  const destination = searchParams.get("destination");

  // Load Google Maps API
  const loadGoogleMaps = (callback) => {
    if (window.google) {
      callback();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBW-qg_iQkuBMC_1BmilF2RC_OCNiCeF2I`;
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.body.appendChild(script);
  };

  useEffect(() => {
    async function fetchBusesAndRenderMap() {
      setLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/buses?source=${encodeURIComponent(
            source
          )}&destination=${encodeURIComponent(destination)}`
        );
        const result = await response.json();
        const busList = result.buses || [];
        setBuses(busList);

        if (busList.length > 0) {
          const bus = busList[0]; // Assuming first bus

          if (bus.current_lat && bus.current_lng) {
            loadGoogleMaps(() => {
              const map = new window.google.maps.Map(
                document.getElementById("map"),
                {
                  center: { lat: bus.current_lat, lng: bus.current_lng },
                  zoom: 13,
                }
              );

              // Bus marker
              new window.google.maps.Marker({
                position: { lat: bus.current_lat, lng: bus.current_lng },
                map,
                label: "🚌",
                title: bus.bus_name,
              });

              // Geocode source and destination
              const geocoder = new window.google.maps.Geocoder();

              // Source marker
              geocoder.geocode({ address: source }, (results, status) => {
                if (status === "OK") {
                  new window.google.maps.Marker({
                    position: results[0].geometry.location,
                    map,
                    label: "S",
                    title: "Source",
                  });
                }
              });

              // Destination marker
              geocoder.geocode({ address: destination }, (results, status) => {
                if (status === "OK") {
                  new window.google.maps.Marker({
                    position: results[0].geometry.location,
                    map,
                    label: "D",
                    title: "Destination",
                  });
                }
              });
            });
          }
        }
      } catch (error) {
        console.error("Error fetching buses:", error);
        setBuses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBusesAndRenderMap();
  }, [source, destination]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "Not Available";
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1976d2 0%, #2196f3 100%)",
        py: 8,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Typography
          variant="h4"
          fontWeight="bold"
          color="white"
          gutterBottom
          textAlign="center"
        >
          Buses from {source} to {destination}
        </Typography>

        {loading ? (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <CircularProgress color="inherit" />
          </Box>
        ) : buses.length === 0 ? (
          <Typography
            variant="body1"
            color="white"
            textAlign="center"
            mt={4}
            mb={4}
          >
            No buses found.
          </Typography>
        ) : (
          buses.map((bus) => {
            const formattedArrivalSource = formatDateTime(bus.arrival_at_source);
            const formattedArrivalDest = formatDateTime(bus.expected_arrival_at_dest);
            const currentLocation =
              bus.current_lat && bus.current_lng
                ? `${bus.current_lat.toFixed(4)}, ${bus.current_lng.toFixed(4)}`
                : "Not Available";

            return (
              <Paper
                key={bus.id}
                elevation={4}
                sx={{
                  mb: 3,
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.9)",
                }}
              >
                <Typography variant="h6" fontWeight="bold" color="#1976d2">
                  {bus.bus_name}
                </Typography>
                <Typography variant="body2" color="#333" mt={1}>
                  Arrival at source: {formattedArrivalSource}
                </Typography>
                <Typography variant="body2" color="#333" mt={1}>
                  Arrival at destination: {formattedArrivalDest}
                </Typography>
                <Typography variant="body2" color="#555" mt={1}>
                  Current location: {currentLocation}
                </Typography>
              </Paper>
            );
          })
        )}

        {/* Google Map Display */}
        <Box
          id="map"
          sx={{
            width: "100%",
            height: "400px",
            mt: 4,
            borderRadius: 2,
            overflow: "hidden",
          }}
        />

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button component={Link} to="/" variant="outlined" color="inherit">
            Back to Search
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
