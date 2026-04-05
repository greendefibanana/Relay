export const SUPPORTED_ASSET_TYPES = [1, 2, 3, 4, 5, 6] as const;

const ASSET_TYPE_LABELS = new Map<number, string>([
  [1, "SAFT"],
  [2, "Vested Token"],
  [3, "Vested Memecoin"],
  [4, "SAFE"],
  [5, "Private Equity"],
  [6, "Memecoin Equity"],
]);

const VESTING_ASSET_TYPES = new Set<number>([2, 3]);

export function assetTypeLabel(assetType: number): string {
  return ASSET_TYPE_LABELS.get(assetType) ?? `Unknown (${assetType})`;
}

export function isVestingAssetType(assetType: number): boolean {
  return VESTING_ASSET_TYPES.has(assetType);
}
