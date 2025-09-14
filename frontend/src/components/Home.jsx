import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Autocomplete,
  TextField,
  Button,
  Box,
  Paper,
} from "@mui/material";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";

const cities = [
  "New York",
  "San Francisco",
  "Los Angeles",
  "Chicago",
  "Kollam",
  "Perumbavoor",
  "Kottayam",
  "Ernakulam",
  "Angamaly",
  "Thrissur"
];

export default function Home() {
  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const navigate = useNavigate();

  const handleSearch = () => {
    if (!source || !destination) {
      alert("Please select both source and destination.");
      return;
    }
    if (source === destination) {
      alert("Source and destination cannot be the same.");
      return;
    }
    // Navigate to results page with query params
    navigate(`/results?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`);
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
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: "rgba(255,255,255,0.9)",
            textAlign: "center",
          }}
        >
          <DirectionsBusIcon sx={{ fontSize: 60, color: "#1565c0", mb: 1 }} />
          <Typography variant="h4" gutterBottom fontWeight="bold" color="#0d47a1">
            Real-Time Bus Tracker
          </Typography>
          <Typography variant="body1" color="#555" mb={4}>
            Select your source and destination city and find upcoming buses today.
          </Typography>

          <Autocomplete
            disablePortal
            options={cities}
            sx={{ mb: 3 }}
            onChange={(event, value) => setSource(value)}
            renderInput={(params) => <TextField {...params} label="Source City" />}
          />

          <Autocomplete
            disablePortal
            options={cities}
            sx={{ mb: 4 }}
            onChange={(event, value) => setDestination(value)}
            renderInput={(params) => <TextField {...params} label="Destination City" />}
          />

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={handleSearch}
          >
            Search Buses
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
