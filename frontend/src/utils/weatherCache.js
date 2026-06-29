// src/utils/weatherCache.js

const cache = new Map();

function getCacheKey(prefix, params) {
  return `${prefix}:${JSON.stringify(params)}`;
}

function getFromCache(key, maxAgeMinutes = 30) {
  const item = cache.get(key);

  if (!item) return null;

  const now = Date.now();
  const age = now - item.createdAt;
  const maxAge = maxAgeMinutes * 60 * 1000;

  if (age > maxAge) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

function saveToCache(key, data) {
  cache.set(key, {
    data,
    createdAt: Date.now(),
  });
}

module.exports = {
  getCacheKey,
  getFromCache,
  saveToCache,
};