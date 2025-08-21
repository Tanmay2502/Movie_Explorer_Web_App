const API_KEY = "56dd1c7d4dmshe4a72631bc01a6cp11749fjsn50fced693bf6";
const BASE_URL = "https://imdb8.p.rapidapi.com";

const HEADERS = {
  "x-rapidapi-key": API_KEY,
  "x-rapidapi-host": "imdb8.p.rapidapi.com",
};

// Utility: delay function to avoid hitting rate limits (429)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 🔍 Search Movies (with Poster Support)
export const searchMovies = async (query) => {
  try {
    const response = await fetch(
      `${BASE_URL}/title/find?q=${encodeURIComponent(query)}`,
      { method: "GET", headers: HEADERS }
    );
    const data = await response.json();
    if (!data.results) return [];

    return data.results
      .filter((item) => item.titleType === "movie" && item.image?.url)
      .map((movie) => ({
        id: movie.id.split("/")[2],
        title: movie.title || "N/A",
        year: movie.year || "N/A",
        poster: movie.image.url,
      }));
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
};

// 🌟 Top Rated Movies from Most Popular List (with Posters and Ratings)

//const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getPopularMovies = async () => {
  try {
    const response = await fetch(`${BASE_URL}/title/get-most-popular-movies`, {
      method: "GET",
      headers: HEADERS,
    });

    if (!response.ok) {
      console.error("Failed to fetch movie IDs:", response.status);
      return [];
    }

    const ids = await response.json(); // ["/title/tt0111161/", ...]

    const movies = [];

    for (let i = 0; i < 10; i++) {
      const rawId = ids[i];
      if (!rawId) continue;

      const tconst = rawId.split("/")[2]; // Safely extract IMDb ID

      try {
        const [overviewRes, ratingRes] = await Promise.all([
          fetch(`${BASE_URL}/title/get-overview-details?tconst=${tconst}&currentCountry=US`, {
            method: "GET",
            headers: HEADERS,
          }),
          fetch(`${BASE_URL}/title/get-ratings?tconst=${tconst}`, {
            method: "GET",
            headers: HEADERS,
          }),
        ]);

        const overview = await overviewRes.json();
        console.log("Overview for", tconst, overview); // 👈 log image structure
        const rating = await ratingRes.json();

        movies.push({
          id: tconst,
          title: overview.title?.title || "N/A",
          year: overview.title?.year || "N/A",
          poster: overview?.title?.image?.url || "https://via.placeholder.com/300x450?text=No+Image",
          rating: rating.rating || "N/A",
        });
      } catch (movieError) {
        console.error(`Error loading movie ${tconst}`, movieError);
      }

      // ⏳ Wait to avoid 429
      await sleep(300);
    }

    return movies.sort((a, b) => b.rating - a.rating);
  } catch (err) {
    console.error("Top rated fetch failed:", err);
    return [];
  }
};