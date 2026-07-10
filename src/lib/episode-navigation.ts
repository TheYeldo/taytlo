export type EpisodeNavigationItem = {
  id: string | number;
};

export function getEpisodeNavigation<T extends EpisodeNavigationItem>(episodes: T[], selectedId: string | number | null | undefined) {
  const index = selectedId ? episodes.findIndex((episode) => episode.id === selectedId) : -1;
  return {
    index,
    previous: index > 0 ? episodes[index - 1] : null,
    next: index >= 0 && index < episodes.length - 1 ? episodes[index + 1] : null
  };
}
