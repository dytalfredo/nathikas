// Ingrediente individual
export interface Ingredient {
    id: string;
    name: string;
    unit: string; // kg, litros, unidades, gramos, etc.
    costPerUnit: number; // Costo en USD por unidad
    stock?: number; // Cantidad actual en inventario
    supplier?: string;
    lastPurchaseDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

// Ingrediente asignado a un producto
export interface ProductIngredient {
    ingredientId: string;
    ingredientName: string;
    quantity: number; // Cantidad necesaria
    unit: string;
}

// Item de una compra
export interface PurchaseItem {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
}

// Compra de ingredientes
export interface Purchase {
    id: string;
    date: Date;
    supplier: string;
    items: PurchaseItem[];
    totalCost: number; // Total en USD
    notes?: string;
    createdBy: string; // Usuario que registró la compra
    createdAt: Date;
    updatedAt?: Date;
}
