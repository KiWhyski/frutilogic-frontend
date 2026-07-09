export class StockAlert {
    constructor({ id, name, stock, minStock, state, productId, warehouseName }) {
        this.id = id;
        this.name = name;
        this.stock = stock;
        this.minStock = minStock;
        this.state = state;
        this.productId = productId;
        this.warehouseName = warehouseName;
    }

    get isCritical() {
        return this.state === 'out-of-stock' || this.stock <= this.minStock;
    }
}

export class ExpirationAlert {
    constructor({ id, name, expiresIn, expirationDate, warehouseName, productId }) {
        this.id = id;
        this.name = name;
        this.expiresIn = expiresIn;
        this.expirationDate = expirationDate;
        this.warehouseName = warehouseName;
        this.productId = productId;
    }

    get isExpiringSoon() {
        return this.expiresIn <= 15;
    }
}
