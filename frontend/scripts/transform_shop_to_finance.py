#!/usr/bin/env python3
"""One-off transform: shop module files → finance naming and API paths."""

from __future__ import annotations

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src" / "modules" / "finance"

FILE_RENAMES: dict[str, str] = {
    "ShopModuleLayout.tsx": "FinanceModuleLayout.tsx",
    "pages/ShopPage.tsx": "pages/FinancePurchasesPage.tsx",
    "pages/ShopCreatePage.tsx": "pages/FinancePurchaseCreatePage.tsx",
    "pages/ShopItemPage.tsx": "pages/FinancePurchasePage.tsx",
    "pages/ShopMerchantsPage.tsx": "pages/FinanceVendorsPage.tsx",
    "pages/ShopMerchantCreatePage.tsx": "pages/FinanceVendorCreatePage.tsx",
    "pages/ShopMerchantPage.tsx": "pages/FinanceVendorPage.tsx",
    "pages/ShopTagsPage.tsx": "pages/FinancePurchaseTagsPage.tsx",
    "lib/shop.ts": "lib/purchase.ts",
    "lib/shopListSort.ts": "lib/purchaseListSort.ts",
    "lib/shopSearch.ts": "lib/purchaseSearch.ts",
    "lib/shopView.ts": "lib/purchaseView.ts",
    "lib/shopTagDisplay.ts": "lib/purchaseTagDisplay.ts",
    "lib/shopTagListSort.ts": "lib/purchaseTagListSort.ts",
    "lib/shopTagSearch.ts": "lib/purchaseTagSearch.ts",
    "hooks/useShopItemTagCatalog.ts": "hooks/useFinancePurchaseTagCatalog.ts",
    "components/ShopListSearch.tsx": None,  # extracted to shared ListSearch
    "components/ShopViewToggle.tsx": "components/FinanceViewToggle.tsx",
    "components/ShopKanbanView.tsx": "components/FinanceKanbanView.tsx",
    "components/ShopListView.tsx": "components/FinanceListView.tsx",
    "components/ShopListRow.tsx": "components/FinanceListRow.tsx",
    "components/ShopItemCard.tsx": "components/FinancePurchaseCard.tsx",
    "components/ShopMediaLightbox.tsx": "components/FinanceMediaLightbox.tsx",
    "components/ShopMediaCarousel.tsx": "components/FinanceMediaCarousel.tsx",
    "components/ShopMediaCardMenu.tsx": "components/FinanceMediaCardMenu.tsx",
    "components/ShopMerchantCard.tsx": "components/FinanceVendorCard.tsx",
    "components/ShopMerchantManager.tsx": "components/FinanceVendorManager.tsx",
    "components/MerchantSelect.tsx": "components/VendorSelect.tsx",
    "components/MerchantImageBox.tsx": "components/VendorImageBox.tsx",
    "components/MerchantLogoMenu.tsx": "components/VendorLogoMenu.tsx",
    "components/detail/ShopItemDetailView.tsx": "components/detail/FinancePurchaseDetailView.tsx",
    "components/detail/ShopDetailInlineTitle.tsx": "components/detail/FinanceDetailInlineTitle.tsx",
    "components/detail/ShopDetailInlinePrice.tsx": "components/detail/FinanceDetailInlinePrice.tsx",
    "components/detail/ShopDetailInlineNotes.tsx": "components/detail/FinanceDetailInlineNotes.tsx",
    "components/detail/ShopDetailInlineStatus.tsx": "components/detail/FinanceDetailInlineStatus.tsx",
    "components/detail/ShopDetailInlineListingUrl.tsx": "components/detail/FinanceDetailInlineListingUrl.tsx",
    "components/detail/ShopMerchantDetailView.tsx": "components/detail/FinanceVendorDetailView.tsx",
    "components/detail/ShopMerchantDetailInlineTitle.tsx": "components/detail/FinanceVendorDetailInlineTitle.tsx",
    "components/tags/ShopTagsListView.tsx": "components/tags/FinancePurchaseTagsListView.tsx",
    "components/tags/ShopTagListRow.tsx": "components/tags/FinancePurchaseTagListRow.tsx",
    "components/tags/ShopTagPill.tsx": "components/tags/FinancePurchaseTagPill.tsx",
    "components/tags/ShopItemInlineTags.tsx": "components/tags/FinancePurchaseInlineTags.tsx",
}

CONTENT_REPLACEMENTS: list[tuple[str, str]] = [
    ("shopShellRoutes", "financeShellRoutes"),
    ("shopModuleSubNavItems", "financeModuleSubNavItems"),
    ("shopNavItem", "financeNavItem"),
    ("shopQueryKeys", "financeQueryKeys"),
    ("ShopListingProposalConfirmResult", "FinanceListingProposalConfirmResult"),
    ("ShopListingProposal", "FinanceListingProposal"),
    ("ShopItemGalleryEntry", "FinancePurchaseGalleryEntry"),
    ("ShopItemCreatePayload", "FinancePurchaseCreatePayload"),
    ("ShopItemUpdatePayload", "FinancePurchaseUpdatePayload"),
    ("ShopItemTagCreatePayload", "FinancePurchaseTagCreatePayload"),
    ("ShopItemTagUpdatePayload", "FinancePurchaseTagUpdatePayload"),
    ("ShopMerchantCreatePayload", "FinanceVendorCreatePayload"),
    ("ShopMerchantUpdatePayload", "FinanceVendorUpdatePayload"),
    ("ShopItemTag", "FinancePurchaseTag"),
    ("ShopItemStatus", "FinancePurchaseStatus"),
    ("ShopItem", "FinancePurchase"),
    ("ShopMerchant", "FinanceVendor"),
    ("ShopViewMode", "FinanceViewMode"),
    ("ShopViewToggle", "FinanceViewToggle"),
    ("ShopKanbanView", "FinanceKanbanView"),
    ("ShopListView", "FinanceListView"),
    ("ShopListRow", "FinanceListRow"),
    ("ShopMediaLightbox", "FinanceMediaLightbox"),
    ("ShopMediaCarousel", "FinanceMediaCarousel"),
    ("ShopMediaCardMenu", "FinanceMediaCardMenu"),
    ("ShopMerchantCard", "FinanceVendorCard"),
    ("ShopMerchantManager", "FinanceVendorManager"),
    ("MerchantSelect", "VendorSelect"),
    ("MerchantImageBox", "VendorImageBox"),
    ("MerchantLogoMenu", "VendorLogoMenu"),
    ("ShopItemDetailView", "FinancePurchaseDetailView"),
    ("ShopDetailInlineTitle", "FinanceDetailInlineTitle"),
    ("ShopDetailInlinePrice", "FinanceDetailInlinePrice"),
    ("ShopDetailInlineNotes", "FinanceDetailInlineNotes"),
    ("ShopDetailInlineStatus", "FinanceDetailInlineStatus"),
    ("ShopDetailInlineListingUrl", "FinanceDetailInlineListingUrl"),
    ("ShopMerchantDetailView", "FinanceVendorDetailView"),
    ("ShopMerchantDetailInlineTitle", "FinanceVendorDetailInlineTitle"),
    ("ShopTagsListView", "FinancePurchaseTagsListView"),
    ("ShopTagListRow", "FinancePurchaseTagListRow"),
    ("ShopTagPill", "FinancePurchaseTagPill"),
    ("ShopItemInlineTags", "FinancePurchaseInlineTags"),
    ("ShopTagsPage", "FinancePurchaseTagsPage"),
    ("ShopCreatePage", "FinancePurchaseCreatePage"),
    ("ShopItemPage", "FinancePurchasePage"),
    ("ShopMerchantsPage", "FinanceVendorsPage"),
    ("ShopMerchantCreatePage", "FinanceVendorCreatePage"),
    ("ShopMerchantPage", "FinanceVendorPage"),
    ("ShopPage", "FinancePurchasesPage"),
    ("ShopModuleLayout", "FinanceModuleLayout"),
    ("useShopItemTagCatalog", "useFinancePurchaseTagCatalog"),
    ("shopItemCoverUrl", "financePurchaseCoverUrl"),
    ("fetchShopListingProposal", "fetchFinanceListingProposal"),
    ("confirmShopListingProposal", "confirmFinanceListingProposal"),
    ("declineShopListingProposal", "declineFinanceListingProposal"),
    ("fetchShopItemTags", "fetchFinancePurchaseTags"),
    ("createShopItemTag", "createFinancePurchaseTag"),
    ("updateShopItemTag", "updateFinancePurchaseTag"),
    ("deleteShopItemTag", "deleteFinancePurchaseTag"),
    ("fetchShopItemMedia", "fetchFinancePurchaseMedia"),
    ("deleteShopItemMedia", "deleteFinancePurchaseMedia"),
    ("setShopItemCoverFromMedia", "setFinancePurchaseCoverFromMedia"),
    ("attachShopItemMediaFromMedia", "attachFinancePurchaseMediaFromMedia"),
    ("uploadShopItemMedia", "uploadFinancePurchaseMedia"),
    ("uploadShopMerchantImage", "uploadFinanceVendorImage"),
    ("setShopMerchantImageFromMedia", "setFinanceVendorImageFromMedia"),
    ("fetchShopMerchants", "fetchFinanceVendors"),
    ("fetchShopMerchant", "fetchFinanceVendor"),
    ("createShopMerchant", "createFinanceVendor"),
    ("updateShopMerchant", "updateFinanceVendor"),
    ("deleteShopMerchant", "deleteFinanceVendor"),
    ("fetchShopItems", "fetchFinancePurchases"),
    ("fetchShopItem", "fetchFinancePurchase"),
    ("createShopItem", "createFinancePurchase"),
    ("updateShopItem", "updateFinancePurchase"),
    ("deleteShopItem", "deleteFinancePurchase"),
    ("shopMerchantMatchesSearch", "financeVendorMatchesSearch"),
    ("filterShopItemGroups", "filterFinancePurchaseGroups"),
    ("sortShopItemTags", "sortFinancePurchaseTags"),
    ("filterShopItemTags", "filterFinancePurchaseTags"),
    ("readShopViewMode", "readFinanceViewMode"),
    ("writeShopViewMode", "writeFinanceViewMode"),
    ("isShopItemStatus", "isFinancePurchaseStatus"),
    ("shopStatusLabel", "financePurchaseStatusLabel"),
    ("shopStatusPillClass", "financePurchaseStatusPillClass"),
    ("SHOP_STATUSES", "PURCHASE_STATUSES"),
    ("DEFAULT_SHOP_ITEM_TAG_COLOR", "DEFAULT_FINANCE_PURCHASE_TAG_COLOR"),
    ("shopListSort", "purchaseListSort"),
    ("shopTagSearch", "purchaseTagSearch"),
    ("shopTagListSort", "purchaseTagListSort"),
    ("shopTagDisplay", "purchaseTagDisplay"),
    ("shopSearch", "purchaseSearch"),
    ("shopView", "purchaseView"),
    ('"/shop/merchants/new"', '"/finance/vendors/new"'),
    ('"/shop/merchants"', '"/finance/vendors"'),
    ('"/shop/tags"', '"/finance/tags/purchases"'),
    ('"/shop/new"', '"/finance/purchases/new"'),
    ('"/shop"', '"/finance"'),
    ("`/shop/merchants/${", "`/finance/vendors/${"),
    ("`/shop/${", "`/finance/purchases/${"),
    ('path="shop"', 'path="finance"'),
    ('moduleId="shop"', 'moduleId="finance"'),
    ('moduleTitle="Shop"', 'moduleTitle="Finance"'),
    ('ariaLabel="Shop module sections"', 'ariaLabel="Finance module sections"'),
    ("Shop module", "Finance module"),
    ("shop module", "finance module"),
    ("shop item", "purchase"),
    ("Shop item", "Purchase"),
    ("shop items", "purchases"),
    ("Shop items", "Purchases"),
    ("shop item tag", "purchase tag"),
    ("Shop item tag", "Purchase tag"),
    ("Shop tag", "Purchase tag"),
    ("shop tag", "purchase tag"),
    ("merchant", "vendor"),
    ("Merchant", "Vendor"),
    ("item_count", "purchase_count"),
    ("created_item_id", "created_purchase_id"),
    ("created_merchant_id", "created_vendor_id"),
    ('entity_type: "shop_item"', 'entity_type: "finance_purchase"'),
    ('entity_type: "shop_merchant"', 'entity_type: "finance_vendor"'),
    ('"shop_item"', '"finance_purchase"'),
    ('"shop_merchant"', '"finance_vendor"'),
    ('["shop"]', '["finance"]'),
    ("/shop/tags", "/finance/purchase-tags"),
    ('apiFetch<ShopItem[]>(`/shop', 'apiFetch<FinancePurchase[]>(`/finance/purchases'),
    ('apiFetch<ShopItem>(`/shop/', 'apiFetch<FinancePurchase>(`/finance/purchases/'),
    ('apiFetch<ShopItem>("/shop"', 'apiFetch<FinancePurchase>("/finance/purchases"'),
    ('/shop/merchants', '/finance/vendors'),
    ('/shop/proposals', '/finance/proposals'),
    ('/shop/tags', '/finance/purchase-tags'),
    ("from \"./lib/shop\"", "from \"./lib/purchase\""),
    ("from '../lib/shop'", "from '../lib/purchase'"),
    ("from \"../lib/shop\"", "from \"../lib/purchase\""),
    ("ShopListSearch", "ListSearch"),
    ("../../../components/ListSearch", "../../../components/ListSearch"),
    ("../../components/ListSearch", "../../components/ListSearch"),
    ("../components/ShopListSearch", "../../../components/ListSearch"),
    ("../components/ListSearch", "../../../components/ListSearch"),
    ("itemId", "purchaseId"),
    ("item_id", "purchase_id"),
]

ROUTE_PARAM_FIXES = [
    (":purchaseId", ":purchaseId"),
]


def transform_content(text: str) -> str:
    for old, new in CONTENT_REPLACEMENTS:
        text = text.replace(old, new)
    # Fix double-replacements from merchant→vendor on already-vendor words
    text = text.replace("vvendor", "vendor")
    text = text.replace("VVendor", "Vendor")
    text = text.replace("finance_vvendor", "finance_vendor")
    # API path fixes
    text = re.sub(r"`/finance/purchases/\$\{purchaseId\}`", "`/finance/purchases/${purchaseId}`", text)
    text = text.replace("/finance/purchase-tags/{tagId}", "/finance/purchase-tags/{tagId}")
    text = text.replace("financeQueryKeys.vendors()", "financeQueryKeys.vendors()")
    text = text.replace("financeQueryKeys.vendor(", "financeQueryKeys.vendor(")
    text = text.replace("financeQueryKeys.purchases()", "financeQueryKeys.purchases()")
    text = text.replace("financeQueryKeys.purchase(", "financeQueryKeys.purchase(")
    # Fix query key method names that got broken
    text = text.replace(".items()", ".purchases()")
    text = text.replace(".itemsList", ".purchasesList")
    text = text.replace(".item(", ".purchase(")
    text = text.replace(".itemMedia", ".purchaseMedia")
    text = text.replace(".merchants()", ".vendors()")
    text = text.replace(".merchant(", ".vendor(")
    text = text.replace("purchase-tags", "purchase-tags")
    text = text.replace("FinancePurchaseCard", "FinancePurchaseCard")
    text = text.replace("ShopItemCard", "FinancePurchaseCard")
    return text


def main() -> None:
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix not in {".ts", ".tsx", ".md"}:
            continue
        original = path.read_text(encoding="utf-8")
        transformed = transform_content(original)
        if transformed != original:
            path.write_text(transformed, encoding="utf-8")

    for old_rel, new_rel in FILE_RENAMES.items():
        old_path = ROOT / old_rel
        if not old_path.exists():
            continue
        if new_rel is None:
            old_path.unlink()
            continue
        new_path = ROOT / new_rel
        new_path.parent.mkdir(parents=True, exist_ok=True)
        if old_path != new_path:
            old_path.rename(new_path)

    print("Transform complete.")


if __name__ == "__main__":
    main()
