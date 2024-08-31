const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors')
app.use(cors())
// SQLite setup
const db = new sqlite3.Database('./weather.db');

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS weather'); 
  db.run(`
    CREATE TABLE IF NOT EXISTS weather (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location TEXT,
      temperature REAL,
      description TEXT,
      weather_code INTEGER,
      wind_speed REAL,
      wind_degree INTEGER,
      wind_air REAL,
      pressure REAL,
      wind_dir TEXT,
      humidity INTEGER,
      cloudcover INTEGER,
      feelslike REAL,
      uv_index INTEGER,
      visibility REAL,
      fetchedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Weatherstack API key
const WEATHERSTACK_API_KEY = 'fb58db8b9dc519a50b969eb9b78171cf';
const WEATHERSTACK_API_URL = 'http://api.weatherstack.com/current';

app.use(express.json());

// Route to fetch weather data
app.get('/weather', async (req, res) => {
  const { location } = req.query;

  if (!location) {
    return res.status(400).json({ error: 'Location parameter is required' });
  }

  try {
    const response = await axios.get(WEATHERSTACK_API_URL, {
      params: {
        access_key: WEATHERSTACK_API_KEY,
        query: location,
      },
    });

    const {
      temperature,
      weather_descriptions,
      weather_code,
      wind_speed,
      wind_degree,
      wind_air,
      pressure,
      wind_dir,
      humidity,
      cloudcover,
      feelslike,
      uv_index,
      visibility
    } = response.data.current;

    // Save to SQLite database
    db.run(
      `INSERT INTO weather (location, temperature, description, weather_code, wind_speed, wind_degree, wind_air, pressure, wind_dir, humidity, cloudcover, feelslike, uv_index, visibility)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [location, temperature, weather_descriptions.join(', '), weather_code, wind_speed, wind_degree, wind_air, pressure, wind_dir, humidity, cloudcover, feelslike, uv_index, visibility],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({
          location,
          weather_code,
          wind_speed,
          wind_degree,
          wind_air,
          pressure,
          wind_dir,
          humidity,
          cloudcover,
          feelslike,
          uv_index,
          visibility,
          temperature,
          description: weather_descriptions.join(', ')
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
