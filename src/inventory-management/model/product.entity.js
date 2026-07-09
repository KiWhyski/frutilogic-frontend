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
    }) {
        this.productId = productId ?? '';
        this.name = name ?? '';
        this.brandName = brandName ?? '';
        this.liquorType = liquorType ?? '';
        this.unitPriceAmount = unitPriceAmount ?? 0;
        this.minimumStock = minimumStock ?? 0;
        this.imageUrl = imageUrl ?? '';
        this.providerId = providerId ?? accountId ?? '';
        this.accountId = accountId ?? providerId ?? '';
    }
}
