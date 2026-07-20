export type ListingSeller = {
  companyName?: string;
};

export type ListingCard = {
  id: number;
  title: string;
  category?: string;
  weight: number;
  pricePerUnit: number;
  status: string;
  imageUrl: string | null;
  dimensions: string;
  pickupLocation?: string;
  description?: string;
  seller?: ListingSeller;
};

const LISTING_STATUS_RANK: Record<string, number> = {
  PENDING_PICKUP: 0,
  AVAILABLE: 1,
  SOLD: 2,
};

export function sortFactoryInventory(listings: ListingCard[]): ListingCard[] {
  return [...listings].sort((a, b) => {
    const rankA = LISTING_STATUS_RANK[a.status] ?? 99;
    const rankB = LISTING_STATUS_RANK[b.status] ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return b.id - a.id;
  });
}

export function inventoryWithoutPending(listings: ListingCard[]): ListingCard[] {
  return sortFactoryInventory(listings.filter((item) => item.status !== 'PENDING_PICKUP'));
}

export type OrderLike = { id: number; status: string };

export function sortOrdersPendingFirst<T extends OrderLike>(orders: T[]): T[] {
  return [...orders].sort((a, b) => {
    const pendingA = a.status === 'PAID_TO_ESCROW' ? 0 : 1;
    const pendingB = b.status === 'PAID_TO_ESCROW' ? 0 : 1;
    if (pendingA !== pendingB) return pendingA - pendingB;
    return b.id - a.id;
  });
}

export function matchesListingSearch(
  item: ListingCard,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.title.toLowerCase().includes(q) ||
    (item.category?.toLowerCase().includes(q) ?? false) ||
    (item.pickupLocation?.toLowerCase().includes(q) ?? false) ||
    (item.description?.toLowerCase().includes(q) ?? false) ||
    (item.seller?.companyName?.toLowerCase().includes(q) ?? false)
  );
}
