builder.defineMetaHandler(async (args) => {
    if (args.id.includes(BLEACH_IMDB_ID)) {
        try {
            const res = await fetchMetaData(`https://v3-cinemeta.strem.fun/meta/series/${args.id}.json`);

            if (res && res.meta && res.meta.videos) {
                res.meta.videos = res.meta.videos.map((ep) => {
                    // Extract absolute episode number (e.g. S1E169 -> 169)
                    const absoluteEp = ep.episode || ep.number;

                    if (fillerEpisodes.has(absoluteEp)) {
                        return {
                            ...ep,
                            title: `⚠️ [FILLER] ${ep.title}`,
                            overview: `[CANON WARNING: FILLER ARC] ${ep.overview || ''}`
                        };
                    }
                    return ep;
                });
                return { meta: res.meta };
            }
        } catch (err) {
            console.error("Error fetching metadata:", err);
        }
    }
    return { meta: null };
});
