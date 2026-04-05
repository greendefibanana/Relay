use bolt_lang::*;

declare_id!("84rAQe7vMX8F8BevA9go8CWETc5FZJyKVgT5nowff81Z");

#[component(delegate)]
#[derive(Copy, Default)]
pub struct AssetRegistry {
    pub owner: Pubkey,
    pub seller_payout: Pubkey,
    /// 1 = SAFT, 2 = Vested Token, 3 = Vested Memecoin, 4 = SAFE,
    /// 5 = Private Equity, 6 = Memecoin Equity
    pub asset_type: u8,
    pub is_sold: bool,
}
