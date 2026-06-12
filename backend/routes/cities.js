const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const citiesPath = path.join(__dirname, '..', 'data', 'cities.json');
let citiesCache = null;

function loadCities() {
  if (citiesCache) return citiesCache;
  try {
    const data = fs.readFileSync(citiesPath, 'utf8');
    const parsed = JSON.parse(data);
    // Сортируем по населению (убывание) и возвращаем только русские названия
    citiesCache = parsed
      .sort((a, b) => parseInt(b.population) - parseInt(a.population))
      .map(c => c.name)
      .filter(Boolean);
    return citiesCache;
  } catch (err) {
    console.error('❌ Error loading cities:', err.message);
    return [];
  }
}

// 🔹 Получить список городов России
router.get('/', (req, res) => {
  const cities = loadCities();
  res.json(cities);
});

module.exports = router;
