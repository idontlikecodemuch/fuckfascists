import { useCallback, useEffect, useState } from 'react';
import type { ArchivedCard } from '../data/cardArchive';
import { listArchivedCards, pruneArchive } from '../data/cardArchive';

export function useCardArchive() {
  const [cards, setCards] = useState<ArchivedCard[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listArchivedCards();
    setCards(list);
    setLoading(false);
    await pruneArchive();
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { cards, loading, refresh };
}
