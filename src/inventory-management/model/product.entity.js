export class Product {
    constructor({
        productId,
        name,
        brandName,
        liquorType,
        unitPriceAmount,
        minimumStock,
        imageUrl,
        accountId,
        providerId,
        inventoryId,
        warehouseId,
        currentStock,
        status,
        bestBeforeDate,
        moneyCode,
    }) {
        this.productId = productId ?? '';
        this.name = name ?? '';
        this.brandName = brandName ?? '';
        this.liquorType = liquorType ?? '';
        this.brand = this.brandName;
        this.type = this.liquorType;
        this.unitPriceAmount = unitPriceAmount ?? 0;
        this.minimumStock = minimumStock ?? 0;
        this.imageUrl = imageUrl ?? '';
        this.providerId = providerId ?? accountId ?? '';
        this.accountId = accountId ?? providerId ?? '';
        this.inventoryId = inventoryId ?? '';
        this.id = this.inventoryId || this.productId;
        this.warehouseId = warehouseId ?? '';
        this.currentStock = currentStock ?? 0;
        this.status = status ?? '';
        this.bestBeforeDate = bestBeforeDate ?? null;
        this.moneyCode = moneyCode ?? '';
    }
}
