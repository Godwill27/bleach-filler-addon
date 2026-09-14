const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const https = require("https");

// Bleach IMDb ID
const BLEACH_IMDB_ID = "tt0434665";

// Major Bleach Filler Episode Numbers
const fillerEpisodes = new Set([
    33, 50, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 204, 205, 213, 214, 287, 298, 299,
    ...Array.from({ length: 46 }, (_, i) => 64 + i),   // Bount Arc (64-109)
    ...Array.from({ length: 22 }, (_, i) => 168 + i),  // Amagai Arc (168-189)
    ...Array.from({ length: 38 }, (_, i) => 228 + i),  // Zanpakuto Arc (228-265)
    ...Array.from({ length: 14 }, (_, i) => 303 + i),  // Invading Army Arc (303-316)
    ...Array.from({ length: 13 }, (_, i) => 342 + i)   // Reigai Arc (342-354)
]);

const manifest = {
    id: "org.bleach.filler.indicator",
    version: "1.0.0",
    name: "Bleach Filler Indicator",
    description: "Adds filler warnings to Bleach episodes on Nuvio",
    resources: ["meta"],
    types: ["series"],
    idPrefixes: ["tt"],
    catalogs: []
};

// Helper function to fetch data safely using Node https
function fetchMetaData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let body = "";
            res.on("data", (chunk) => body += chunk);
            res.on("end", () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        }).on("error", reject);
    });
}

const builder = new addonBuilder(manifest);

builder.defineMetaHandler(async (args) => {
    if (args.id.includes(BLEACH_IMDB_ID)) {
        try {
            const data = await fetchMetaData(`https://v3-cinemeta.strem.fun/meta/series/${args.id}.json`);

            if (data && data.meta && data.meta.videos) {
                data.meta.videos = data.meta.videos.map((ep) => {
                    // Detect episode number from episode field or video number
                    const epNum = ep.episode || ep.number;

                    if (fillerEpisodes.has(epNum)) {
                        return {
                            ...ep,
                            title: `⚠️ [FILLER] ${ep.title || `Episode ${epNum}`}`,
                            overview: `[CANON WARNING: FILLER ARC] ${ep.overview || ''}`
                        };
                    }
                    return ep;
                });
                return { meta: data.meta };
            }
        } catch (err) {
            console.error("Error fetching metadata:", err);
        }
    }
    return { meta: null };
});

const port = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port });
