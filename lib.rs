#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod dextr_ink_contract {
    use ink::storage::Mapping;

    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct Order {
        pub id: u128,
        pub token: AccountId,
        pub creator: AccountId,
        pub amount: Balance,
        pub lpsettler_id: u64,
        pub status: bool,
    }

    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct Liquidity {
        pub id: u128,
        pub token: AccountId,
        pub creator: AccountId,
        pub amount: Balance,
    }

    #[ink(event)]
    pub struct OrderCreated {
        #[ink(topic)]
        id: u128,
        #[ink(topic)]
        creator: AccountId,
        token: AccountId,
        amount: Balance,
        lpsettler_id: u64,
    }

    #[ink(storage)]
    pub struct DextrStorage {
        orders: Mapping<u128, Order>,
        admin: AccountId,
        liquidity_groups: Mapping<(AccountId, AccountId), Liquidity>,
        total_orders: u128,
        total_liquidity_groups: u128,

        usdc_balances: Mapping<AccountId, Balance>,
        weth_balances: Mapping<AccountId, Balance>,

        oracle_usdc_per_weth: Balance,
        oracle_weth_per_usdc: Balance,
    }

    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub enum LiquidityError {
        ZeroAmount,
        UnknownToken,
        InsufficientBalance,
    }

    #[ink(event)]
    pub struct LiquidityCreated {
        #[ink(topic)]
        id: u128,
        #[ink(topic)]
        provider: AccountId,
        #[ink(topic)]
        token: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct LiquidityIncreased {
        #[ink(topic)]
        id: u128,
        #[ink(topic)]
        provider: AccountId,
        #[ink(topic)]
        token: AccountId,
        delta: Balance,
        new_amount: Balance,
    }

    #[ink(event)]
    pub struct OrderMatched {
        #[ink(topic)]
        order_id: u128,
        #[ink(topic)]
        lp: AccountId,
        #[ink(topic)]
        seller: AccountId,
        token_in: AccountId,
        token_out: AccountId,
        amount_in: Balance,
        amount_out: Balance,
        price_used: Balance,
    }

    impl DextrStorage {
        #[ink(constructor)]
        pub fn new(admin: AccountId) -> Self {
            Self {
                admin,
                orders: Mapping::default(),
                liquidity_groups: Mapping::default(),
                total_liquidity_groups: 0,
                total_orders: 0,
                usdc_balances: Mapping::default(),
                weth_balances: Mapping::default(),
                oracle_usdc_per_weth: 0,
                oracle_weth_per_usdc: 0,
            }
        }

        #[ink(message)]
        pub fn create_order(
            &mut self,
            token: AccountId,
            amount: Balance,
            lpsettler_id: u64,
        ) -> u128 {
            let caller = self.env().caller();

            self.total_orders = self.total_orders.checked_add(1).unwrap();

            let order = Order {
                id: self.total_orders,
                token,
                creator: caller,
                amount,
                lpsettler_id,
                status: true,
            };

            self.orders.insert(self.total_orders, &order);

            self.env().emit_event(OrderCreated {
                id: self.total_orders,
                creator: caller,
                token,
                amount,
                lpsettler_id,
            });

            self.total_orders
        }

        #[ink(message)]
        pub fn get_order(&self, id: u128) -> Option<Order> {
            self.orders.get(id)
        }

        #[ink(message)]
        pub fn mint_usdc(&mut self, amount: Balance) -> Balance {
            let me = self.env().caller();
            let cur = self.usdc_balances.get(me).unwrap_or(0);
            let new_bal = cur.saturating_add(amount);
            self.usdc_balances.insert(me, &new_bal);
            new_bal
        }

        #[ink(message)]
        pub fn mint_weth(&mut self, amount: Balance) -> Balance {
            let me = self.env().caller();
            let cur = self.weth_balances.get(me).unwrap_or(0);
            let new_bal = cur.saturating_add(amount);
            self.weth_balances.insert(me, &new_bal);
            new_bal
        }

        #[ink(message)]
        pub fn create_liquidity(&mut self, token: AccountId, amount: Balance) -> u128 {
            assert!(amount > 0, "amount=0");
            assert!(Self::is_known_token(&token), "unknown token");

            let caller = self.env().caller();
            let bal = self.balance_of_token(&token, &caller);
            assert!(bal >= amount, "insufficient balance");
            self.set_balance_of_token(&token, &caller, bal - amount);

            let key = (caller, token);
            if let Some(mut l) = self.liquidity_groups.get(key) {
                l.amount = l.amount.saturating_add(amount);
                self.liquidity_groups.insert(key, &l);
                self.env().emit_event(LiquidityIncreased {
                    id: l.id,
                    provider: caller,
                    token,
                    delta: amount,
                    new_amount: l.amount,
                });
                return l.id;
            }

            self.total_liquidity_groups = self.total_liquidity_groups.saturating_add(1);
            let l = Liquidity {
                id: self.total_liquidity_groups,
                token,
                creator: caller,
                amount,
            };
            self.liquidity_groups.insert(key, &l);
            self.env().emit_event(LiquidityCreated {
                id: l.id,
                provider: caller,
                token,
                amount,
            });
            l.id
        }

        #[ink(message)]
        pub fn admin_match_order(&mut self, order_id: u128, lp: AccountId) {
            assert_eq!(self.env().caller(), self.admin, "not admin");

            let mut ord = self.orders.get(order_id).expect("order not found");
            assert!(ord.status, "order not open");

            let seller = ord.creator;
            let token_in = ord.token;
            let amount_in = ord.amount;
            assert!(amount_in > 0, "amount=0");

            let (usdc, weth) = self.token_addresses();
            assert!(token_in == usdc || token_in == weth, "unknown token");

            let (token_out, price_used) = if token_in == weth {
                let p = self.oracle_usdc_per_weth;
                assert!(p > 0, "oracle price not set (USDC/WETH)");
                (usdc, p)
            } else {
                let p = self.oracle_weth_per_usdc;
                assert!(p > 0, "oracle price not set (WETH/USDC)");
                (weth, p)
            };

            let amount_out = amount_in.saturating_mul(price_used);

            let seller_in_bal = self.balance_of_token(&token_in, &seller);
            assert!(seller_in_bal >= amount_in, "seller balance too low");

            let mut lp_out = self
                .liquidity_groups
                .get((lp, token_out))
                .expect("lp pool missing for token_out");
            assert!(lp_out.amount >= amount_out, "insufficient lp liquidity");

            let mut lp_in = self
                .liquidity_groups
                .get((lp, token_in))
                .expect("lp pool missing for token_in");

            self.set_balance_of_token(&token_in, &seller, seller_in_bal - amount_in);

            let seller_out_bal = self.balance_of_token(&token_out, &seller);
            self.set_balance_of_token(
                &token_out,
                &seller,
                seller_out_bal.saturating_add(amount_out),
            );

            lp_out.amount = lp_out.amount - amount_out;
            self.liquidity_groups.insert((lp, token_out), &lp_out);

            lp_in.amount = lp_in.amount.saturating_add(amount_in);
            self.liquidity_groups.insert((lp, token_in), &lp_in);

            ord.status = false;
            self.orders.insert(order_id, &ord);

            self.env().emit_event(OrderMatched {
                order_id,
                lp,
                seller,
                token_in,
                token_out,
                amount_in,
                amount_out,
                price_used,
            });
        }

        #[ink(message)]
        pub fn get_liquidity(&self, provider: AccountId, token: AccountId) -> Option<Liquidity> {
            self.liquidity_groups.get((provider, token))
        }

        #[ink(message)]
        pub fn my_liquidity(&self, token: AccountId) -> Option<Liquidity> {
            let me = self.env().caller();
            self.get_liquidity(me, token)
        }

        #[ink(message)]
        pub fn token_addresses(&self) -> (AccountId, AccountId) {
            (Self::usdc_addr(), Self::weth_addr())
        }

        #[ink(message)]
        pub fn my_balance(&self, token: AccountId) -> Balance {
            let me = self.env().caller();
            self.balance_of_token(&token, &me)
        }

        #[ink(message)]
        pub fn set_oracle_usdc_per_weth(&mut self, p: Balance) {
            assert_eq!(self.env().caller(), self.admin, "not admin");
            self.oracle_usdc_per_weth = p;
        }

        #[ink(message)]
        pub fn set_oracle_weth_per_usdc(&mut self, p: Balance) {
            assert_eq!(self.env().caller(), self.admin, "not admin");
            self.oracle_weth_per_usdc = p;
        }

        #[ink(message)]
        pub fn get_oracle_usdc_per_weth(&self) -> Balance {
            self.oracle_usdc_per_weth
        }

        #[ink(message)]
        pub fn get_oracle_weth_per_usdc(&self) -> Balance {
            self.oracle_weth_per_usdc
        }

        #[inline]
        fn usdc_addr() -> AccountId {
            AccountId::from([0x55; 32])
        }

        #[inline]
        fn weth_addr() -> AccountId {
            AccountId::from([0x57; 32])
        }

        fn is_known_token(token: &AccountId) -> bool {
            *token == Self::usdc_addr() || *token == Self::weth_addr()
        }

        fn balance_of_token(&self, token: &AccountId, owner: &AccountId) -> Balance {
            if *token == Self::usdc_addr() {
                self.usdc_balances.get(owner).unwrap_or(0)
            } else if *token == Self::weth_addr() {
                self.weth_balances.get(owner).unwrap_or(0)
            } else {
                0
            }
        }

        fn set_balance_of_token(&mut self, token: &AccountId, owner: &AccountId, value: Balance) {
            if *token == Self::usdc_addr() {
                self.usdc_balances.insert(owner, &value);
            } else if *token == Self::weth_addr() {
                self.weth_balances.insert(owner, &value);
            }
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        type E = ink::env::DefaultEnvironment;
        use ink::env::test;

        #[ink::test]
        fn test_order_book() {
            let admin = admin();
            let token = token();

            let mut contract = DextrStorage::new(admin);

            test::set_caller::<E>(alice());
            let id = contract.create_order(token, 1_000_000_000_000, 7);

            let ord = contract.get_order(id).expect("order must exist");
            assert_eq!(ord.id, id);
            assert_eq!(ord.token, token);
            assert_eq!(ord.amount, 1_000_000_000_000);
            assert_eq!(ord.creator, alice());
        }

        #[ink::test]
        fn mint_and_liquidity() {
            test::set_caller::<E>(alice());

            let mut dex = DextrStorage::new(admin());
            let (usdc, weth) = dex.token_addresses();

            assert_eq!(dex.mint_usdc(300_000_000), 300_000_000);
            assert_eq!(
                dex.mint_weth(2_000_000_000_000_000_000),
                2_000_000_000_000_000_000
            );

            let lid1 = dex.create_liquidity(usdc, 200_000_000);
            let l1 = dex.my_liquidity(usdc).unwrap();
            assert_eq!(l1.id, lid1);
            assert_eq!(l1.amount, 200_000_000);
            assert_eq!(dex.my_balance(usdc), 100_000_000);

            let lid2 = dex.create_liquidity(usdc, 50_000_000);
            let l2 = dex.my_liquidity(usdc).unwrap();
            assert_eq!(lid1, lid2);
            assert_eq!(l2.amount, 250_000_000);
            assert_eq!(dex.my_balance(usdc), 50_000_000);

            let lid3 = dex.create_liquidity(weth, 1_500_000_000_000_000_000);
            let l3 = dex.my_liquidity(weth).unwrap();
            assert_eq!(l3.id, lid3);
            assert_eq!(l3.amount, 1_500_000_000_000_000_000);
            assert_eq!(dex.my_balance(weth), 500_000_000_000_000_000);
        }

        #[ink::test]
        fn match_order_weth_to_usdc_success() {
            use ink::env::test;
            type E = ink::env::DefaultEnvironment;

            let mut dex = DextrStorage::new(admin());
            let (usdc, weth) = dex.token_addresses();

            let lp = alice();
            let taker = bob();

            test::set_caller::<E>(lp);
            dex.mint_usdc(1_000_000);
            dex.mint_weth(10);
            dex.create_liquidity(usdc, 1_000_000);
            dex.create_liquidity(weth, 1);

            test::set_caller::<E>(admin());

            dex.set_oracle_usdc_per_weth(200);
            dex.set_oracle_weth_per_usdc(1);

            test::set_caller::<E>(taker);
            dex.mint_weth(3);
            let oid = dex.create_order(weth, 2, 0);

            test::set_caller::<E>(admin());
            dex.admin_match_order(oid, lp);

            test::set_caller::<E>(taker);

            assert_eq!(dex.my_balance(weth), 1);
            assert_eq!(dex.my_balance(usdc), 400);

            test::set_caller::<E>(lp);
            let lp_usdc = dex.get_liquidity(lp, usdc).unwrap().amount;
            let lp_weth = dex.get_liquidity(lp, weth).unwrap().amount;
            assert_eq!(lp_usdc, 1_000_000 - 400);
            assert_eq!(lp_weth, 1 + 2);

            test::set_caller::<E>(admin());
            let ord = dex.get_order(oid).unwrap();
            assert_eq!(ord.status, false);
        }

        #[ink::test]
        #[should_panic(expected = "not admin")]
        fn match_order_panics_when_not_admin() {
            use ink::env::test;
            type E = ink::env::DefaultEnvironment;

            let mut dex = DextrStorage::new(admin());
            let (_usdc, weth) = dex.token_addresses();

            test::set_caller::<E>(bob());
            dex.mint_weth(2);
            let oid = dex.create_order(weth, 2, 0);

            test::set_caller::<E>(bob());
            dex.admin_match_order(oid, alice());
        }

        #[ink::test]
        #[should_panic(expected = "lp pool missing for token_in")]
        fn match_order_panics_when_lp_token_in_pool_missing() {
            use ink::env::test;
            type E = ink::env::DefaultEnvironment;

            let mut dex = DextrStorage::new(admin());
            let (usdc, weth) = dex.token_addresses();
            let lp = alice();

            test::set_caller::<E>(lp);
            dex.mint_usdc(1_000_000);
            dex.create_liquidity(usdc, 1_000_000);

            test::set_caller::<E>(admin());
            dex.set_oracle_usdc_per_weth(200);

            test::set_caller::<E>(bob());
            dex.mint_weth(2);
            let oid = dex.create_order(weth, 2, 0);

            test::set_caller::<E>(admin());
            dex.admin_match_order(oid, lp);
        }

        #[ink::test]
        #[should_panic(expected = "insufficient lp liquidity")]
        fn match_order_panics_when_lp_liquidity_insufficient() {
            use ink::env::test;
            type E = ink::env::DefaultEnvironment;

            let mut dex = DextrStorage::new(admin());
            let (usdc, weth) = dex.token_addresses();
            let lp = alice();

            test::set_caller::<E>(lp);
            dex.mint_usdc(100);
            dex.mint_weth(1);
            dex.create_liquidity(usdc, 100);
            dex.create_liquidity(weth, 1);

            test::set_caller::<E>(admin());
            dex.set_oracle_usdc_per_weth(200);

            test::set_caller::<E>(bob());
            dex.mint_weth(2);
            let oid = dex.create_order(weth, 2, 0);

            test::set_caller::<E>(admin());
            dex.admin_match_order(oid, lp);
        }

        #[ink::test]
        #[should_panic(expected = "oracle price not set (USDC/WETH)")]
        fn match_order_panics_when_oracle_not_set_for_weth_side() {
            use ink::env::test;
            type E = ink::env::DefaultEnvironment;

            let mut dex = DextrStorage::new(admin());
            let (usdc, weth) = dex.token_addresses();
            let lp = alice();

            test::set_caller::<E>(lp);
            dex.mint_usdc(1_000_000);
            dex.mint_weth(5);
            dex.create_liquidity(usdc, 1_000_000);
            dex.create_liquidity(weth, 1);

            test::set_caller::<E>(bob());
            dex.mint_weth(2);
            let oid = dex.create_order(weth, 2, 0);

            test::set_caller::<E>(admin());
            dex.admin_match_order(oid, lp);
        }

        fn admin() -> AccountId {
            AccountId::from([0x01; 32])
        }

        fn token() -> AccountId {
            AccountId::from([0x0A; 32])
        }

        fn alice() -> AccountId {
            AccountId::from([0xAC; 32])
        }

        fn bob() -> AccountId {
            AccountId::from([0xB0; 32])
        }
    }
}
