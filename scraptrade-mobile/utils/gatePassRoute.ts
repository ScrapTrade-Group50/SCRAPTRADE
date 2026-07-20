export function firstSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? '';
  return value?.trim() ?? '';
}

export type GatePassParams = {
  code: string;
  title: string;
  weight: number | string;
  amount: number;
  factory?: string;
  pickup?: string;
};

export function buildGatePassHref({
  code,
  title,
  weight,
  amount,
  factory,
  pickup,
}: GatePassParams): string {
  const params = new URLSearchParams();
  params.set('code', code);
  params.set('title', title);
  params.set('weight', String(weight));
  params.set('amount', String(amount));
  if (factory) params.set('factory', factory);
  if (pickup) params.set('pickup', pickup);
  return `/(artisan)/gate-pass?${params.toString()}`;
}

export function formatPickupLine(
  factory?: string | null,
  pickup?: string | null
): string | null {
  const factoryLabel = factory?.trim();
  const pickupLabel = pickup?.trim();

  if (factoryLabel && pickupLabel) return `${factoryLabel} • ${pickupLabel}`;
  if (factoryLabel) return factoryLabel;
  if (pickupLabel) return pickupLabel;
  return null;
}

export function formatBuyerLine(
  name?: string | null,
  phone?: string | null
): string | null {
  const buyerName = name?.trim();
  const buyerPhone = phone?.trim();

  if (buyerName && buyerPhone) return `${buyerName} • ${buyerPhone}`;
  if (buyerName) return buyerName;
  if (buyerPhone) return buyerPhone;
  return null;
}
