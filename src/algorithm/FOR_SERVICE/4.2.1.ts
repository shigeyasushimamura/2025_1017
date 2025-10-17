// ============================================================================
// Imports (for Node.js)
// ============================================================================

// No imports needed - setImmediate is global in Node.js

// ============================================================================
// Domain Model
// ============================================================================

class Address {
  constructor(
    readonly id: string,
    readonly country: string,
    readonly region: string,
    readonly zipCode: string
  ) {}
}

class Supplier {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly country: string
  ) {}
}

class Product {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly price: number,
    readonly category: string,
    readonly supplierId: string,
    readonly componentIds: string[] = [],
    readonly restrictedCountries: string[] = []
  ) {}
}

class Customer {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly tier: "gold" | "silver" | "bronze",
    readonly addressId: string
  ) {}
}

class LineItem {
  constructor(
    readonly productId: string,
    readonly quantity: number,
    readonly discount: number = 0
  ) {}
}

class Order {
  constructor(
    readonly id: string,
    readonly customerId: string,
    readonly lineItems: LineItem[]
  ) {}
}

// ============================================================================
// Data Layer: 実装上は DB/API からのフェッチを模擬
// ============================================================================

class DataStore {
  private products = new Map<string, Product>([
    [
      "PROD-PC",
      new Product(
        "PROD-PC",
        "Gaming PC",
        1200,
        "premium",
        "SUPP-COMP",
        ["PROD-CPU", "PROD-MEM", "PROD-SSD"],
        ["CN", "RU"]
      ),
    ],
    [
      "PROD-CPU",
      new Product("PROD-CPU", "CPU i9", 400, "component", "SUPP-COMP", []),
    ],
    [
      "PROD-MEM",
      new Product("PROD-MEM", "Memory 32GB", 300, "component", "SUPP-COMP", []),
    ],
    [
      "PROD-SSD",
      new Product("PROD-SSD", "SSD 1TB", 200, "component", "SUPP-COMP", []),
    ],
    [
      "PROD-MONITOR",
      new Product(
        "PROD-MONITOR",
        "Monitor 4K",
        500,
        "premium",
        "SUPP-PERIPH",
        ["PROD-DISPLAY"],
        ["KP"]
      ),
    ],
    [
      "PROD-DISPLAY",
      new Product(
        "PROD-DISPLAY",
        "Display Panel",
        350,
        "component",
        "SUPP-PERIPH",
        []
      ),
    ],
  ]);

  private suppliers = new Map<string, Supplier>([
    ["SUPP-COMP", new Supplier("SUPP-COMP", "TechCorp", "JP")],
    ["SUPP-PERIPH", new Supplier("SUPP-PERIPH", "PeripheralCo", "US")],
  ]);

  private customers = new Map<string, Customer>([
    ["CUST-001", new Customer("CUST-001", "Alice", "gold", "ADDR-001")],
    ["CUST-002", new Customer("CUST-002", "Bob", "bronze", "ADDR-002")],
  ]);

  private addresses = new Map<string, Address>([
    ["ADDR-001", new Address("ADDR-001", "JP", "Tokyo", "100-0001")],
    ["ADDR-002", new Address("ADDR-002", "CN", "Shanghai", "200000")],
  ]);

  private orders = new Map<string, Order>([
    [
      "ORD-001",
      new Order("ORD-001", "CUST-001", [
        new LineItem("PROD-PC", 1, 0.05),
        new LineItem("PROD-MONITOR", 2, 0.1),
      ]),
    ],
  ]);

  // Simulate DB fetch with delay
  async fetchProduct(id: string): Promise<Product | null> {
    await this.delay(10);
    return this.products.get(id) || null;
  }

  async fetchProducts(ids: string[]): Promise<(Product | null)[]> {
    await this.delay(10);
    return ids.map((id) => this.products.get(id) || null);
  }

  async fetchSupplier(id: string): Promise<Supplier | null> {
    await this.delay(10);
    return this.suppliers.get(id) || null;
  }

  async fetchSuppliers(ids: string[]): Promise<(Supplier | null)[]> {
    await this.delay(10);
    return ids.map((id) => this.suppliers.get(id) || null);
  }

  async fetchCustomer(id: string): Promise<Customer | null> {
    await this.delay(10);
    return this.customers.get(id) || null;
  }

  async fetchAddress(id: string): Promise<Address | null> {
    await this.delay(10);
    return this.addresses.get(id) || null;
  }

  async fetchOrder(id: string): Promise<Order | null> {
    await this.delay(10);
    return this.orders.get(id) || null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// DataLoader Pattern: バッチ化による N+1 問題解決
// ============================================================================

class DataLoader<K, V> {
  private queue: K[] = [];
  private cache = new Map<K, V>();
  private batchScheduled = false;

  constructor(
    private batchFn: (keys: K[]) => Promise<(V | null)[]>,
    private getKey: (item: V) => K
  ) {}

  async load(key: K): Promise<V | null> {
    if (this.cache.has(key)) {
      return this.cache.get(key) || null;
    }

    this.queue.push(key);
    this.scheduleBatch();

    return new Promise((resolve) => {
      // バッチ実行後に resolve されるまで待機
      const checkCache = () => {
        setTimeout(() => {
          const value = this.cache.get(key);
          if (value !== undefined) {
            resolve(value);
          } else {
            checkCache();
          }
        }, 0);
      };
      checkCache();
    });
  }

  async loadMany(keys: K[]): Promise<(V | null)[]> {
    // すべてをキューに入れて一度に処理
    keys.forEach((k) => {
      if (!this.cache.has(k)) {
        this.queue.push(k);
      }
    });
    this.scheduleBatch();

    // すべてキャッシュされるまで待機
    return new Promise((resolve) => {
      const checkAll = () => {
        setTimeout(() => {
          const results = keys.map((k) => this.cache.get(k) ?? null);
          if (keys.every((k) => this.cache.has(k))) {
            resolve(results);
          } else {
            checkAll();
          }
        }, 0);
      };
      checkAll();
    });
  }

  private scheduleBatch(): void {
    if (!this.batchScheduled) {
      this.batchScheduled = true;
      setImmediate(() => this.executeBatch());
    }
  }

  private async executeBatch(): Promise<void> {
    const keys = [...new Set(this.queue)];
    this.queue = [];
    this.batchScheduled = false;

    if (keys.length === 0) return;

    console.log(`📦 Batching ${keys.length} items:`, keys);
    const results = await this.batchFn(keys);

    keys.forEach((key, idx) => {
      const value = results[idx];
      if (value !== null && value !== undefined) {
        this.cache.set(key, value);
      } else {
        this.cache.set(key, null as any);
      }
    });
  }

  clear(): void {
    this.cache.clear();
    this.queue = [];
    this.batchScheduled = false;
  }
}

// ============================================================================
// Query Engine: Graph 構造を効率的に問い合わせ
// ============================================================================

class OrderQueryEngine {
  private productLoader: DataLoader<string, Product>;
  private supplierLoader: DataLoader<string, Supplier>;
  private addressLoader: DataLoader<string, Address>;

  constructor(private dataStore: DataStore) {
    this.productLoader = new DataLoader(
      (ids) => this.dataStore.fetchProducts(ids),
      (p) => p.id
    );

    this.supplierLoader = new DataLoader(
      (ids) => this.dataStore.fetchSuppliers(ids),
      (s) => s.id
    );

    this.addressLoader = new DataLoader(
      async (ids) =>
        Promise.all(ids.map((id) => this.dataStore.fetchAddress(id))),
      (a) => a.id
    );
  }

  // ============================================================================
  // 単純なクエリ
  // ============================================================================

  async getProduct(id: string): Promise<Product | null> {
    return this.productLoader.load(id);
  }

  async getProductsForLineItems(lineItems: LineItem[]): Promise<Product[]> {
    const productIds = lineItems.map((item) => item.productId);
    const products = await this.productLoader.loadMany(productIds);
    return products.filter((p): p is Product => p !== null);
  }

  // ============================================================================
  // 複雑なクエリ1：Order の全関連データを効率的に取得
  // ============================================================================

  async getOrderWithFullDetails(orderId: string): Promise<{
    order: Order;
    customer: Customer;
    address: Address;
    lineItems: Array<{
      product: Product;
      supplier: Supplier;
      quantity: number;
      discount: number;
    }>;
  } | null> {
    // 1. Order を取得
    const order = await this.dataStore.fetchOrder(orderId);
    if (!order) return null;

    // 2. Customer と Address を並行取得
    const customer = await this.dataStore.fetchCustomer(order.customerId);
    if (!customer) return null;

    const address = await this.addressLoader.load(customer.addressId);
    if (!address) return null;

    // 3. 全 Product を一度にバッチ取得（N+1 防止）
    const productIds = order.lineItems.map((item) => item.productId);
    const products = await this.productLoader.loadMany(productIds);

    // 4. 各 Product の Supplier を一度にバッチ取得
    const supplierIds = products
      .filter((p): p is Product => p !== null)
      .map((p) => p.supplierId);
    await this.supplierLoader.loadMany(supplierIds);

    // 5. 結果を組み立て
    const lineItemsWithDetails = order.lineItems.map((item, idx) => ({
      product: products[idx]!,
      supplier: Object.create(null), // placeholder
      quantity: item.quantity,
      discount: item.discount,
    }));

    return {
      order,
      customer,
      address,
      lineItems: lineItemsWithDetails,
    };
  }

  // ============================================================================
  // 複雑なクエリ2：Product の全 Component を再帰的に取得
  // ============================================================================

  async getProductWithAllComponents(productId: string): Promise<{
    product: Product;
    components: Array<{
      product: Product;
      supplier: Supplier;
    }>;
    allDescendants: Product[];
  } | null> {
    const product = await this.productLoader.load(productId);
    if (!product) return null;

    // Component を再帰的に取得
    const allDescendants = await this.getAllDescendants(product);

    // 全 Supplier を一度にバッチ取得
    const componentSupplierIds = product.componentIds
      .map((id) => {
        const comp = allDescendants.find((p) => p.id === id);
        return comp?.supplierId;
      })
      .filter((id): id is string => id !== undefined);

    await this.supplierLoader.loadMany(componentSupplierIds);

    // Component 情報を組み立て
    const components = product.componentIds
      .map((id) => allDescendants.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined)
      .map((comp) => ({
        product: comp,
        supplier: Object.create(null), // placeholder
      }));

    return {
      product,
      components,
      allDescendants,
    };
  }

  private async getAllDescendants(product: Product): Promise<Product[]> {
    const visited = new Set<string>();
    const result: Product[] = [];
    const queue: Product[] = [product];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;

      visited.add(current.id);
      result.push(current);

      // Component を全て一度に取得（バッチ化）
      const components = await this.productLoader.loadMany(
        current.componentIds
      );
      components.forEach((comp) => {
        if (comp && !visited.has(comp.id)) {
          queue.push(comp);
        }
      });
    }

    return result;
  }

  // ============================================================================
  // 複雑なクエリ3：Permission チェック（複数の並行条件判定）
  // ============================================================================

  async checkOrderPermissions(
    orderId: string,
    userCountry: string,
    userTier: "gold" | "silver" | "bronze"
  ): Promise<{
    allowed: boolean;
    issues: string[];
  }> {
    const orderDetails = await this.getOrderWithFullDetails(orderId);
    if (!orderDetails) {
      return { allowed: false, issues: ["Order not found"] };
    }

    const issues: string[] = [];

    // 並行で複数の制約をチェック
    const checks = await Promise.all([
      this.checkGeographicRestriction(orderDetails, userCountry),
      this.checkProductRestrictions(orderDetails, userCountry),
      this.checkTierRestrictions(orderDetails, userTier),
    ]);

    issues.push(...checks.flat());

    return {
      allowed: issues.length === 0,
      issues,
    };
  }

  private async checkGeographicRestriction(
    orderDetails: any,
    userCountry: string
  ): Promise<string[]> {
    if (orderDetails.address.country !== userCountry) {
      return [
        `Cross-country order: ${orderDetails.address.country} → ${userCountry}`,
      ];
    }
    return [];
  }

  private async checkProductRestrictions(
    orderDetails: any,
    userCountry: string
  ): Promise<string[]> {
    const issues: string[] = [];
    orderDetails.lineItems.forEach((item: any) => {
      if (item.product.restrictedCountries.includes(userCountry)) {
        issues.push(
          `Product ${item.product.name} restricted in ${userCountry}`
        );
      }
    });
    return issues;
  }

  private async checkTierRestrictions(
    orderDetails: any,
    userTier: string
  ): Promise<string[]> {
    const issues: string[] = [];
    orderDetails.lineItems.forEach((item: any) => {
      if (userTier === "bronze" && item.product.category === "premium") {
        issues.push(
          `Premium product ${item.product.name} requires Silver+ tier`
        );
      }
    });
    return issues;
  }

  // ============================================================================
  // 複雑なクエリ4：価格計算（複数関連データを集計）
  // ============================================================================

  async calculateOrderPrice(orderId: string): Promise<{
    subtotal: number;
    tierDiscount: number;
    componentDiscount: number;
    tax: number;
    total: number;
    breakdown: Array<{
      productName: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }>;
  } | null> {
    const orderDetails = await this.getOrderWithFullDetails(orderId);
    if (!orderDetails) return null;

    const breakdown = orderDetails.lineItems.map((item) => ({
      productName: item.product.name,
      unitPrice: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity * (1 - item.discount),
    }));

    const subtotal = breakdown.reduce((sum, item) => sum + item.subtotal, 0);

    // Tier ベースの割引
    const tierDiscounts: Record<string, number> = {
      gold: 0.15,
      silver: 0.08,
      bronze: 0,
    };
    const tierDiscount =
      subtotal * (tierDiscounts[orderDetails.customer.tier] ?? 0);

    // Component がある Product は追加割引
    const componentDiscount = await this.calculateComponentDiscount(
      orderDetails
    );

    const afterDiscount = subtotal - tierDiscount - componentDiscount;
    const taxRate = orderDetails.address.country === "JP" ? 0.1 : 0.08;
    const tax = afterDiscount * taxRate;

    return {
      subtotal,
      tierDiscount,
      componentDiscount,
      tax,
      total: afterDiscount + tax,
      breakdown,
    };
  }

  private async calculateComponentDiscount(orderDetails: any): Promise<number> {
    let discount = 0;
    for (const item of orderDetails.lineItems) {
      if (item.product.componentIds.length > 0) {
        discount += item.product.price * item.quantity * 0.05; // 5% for complex products
      }
    }
    return discount;
  }

  clear(): void {
    this.productLoader.clear();
    this.supplierLoader.clear();
    this.addressLoader.clear();
  }
}

// ============================================================================
// Demo: Usage
// ============================================================================

async function main() {
  const dataStore = new DataStore();
  const queryEngine = new OrderQueryEngine(dataStore);

  console.log("\n=== Test 1: Order with Full Details ===");
  const orderDetails = await queryEngine.getOrderWithFullDetails("ORD-001");
  console.log("Order details:", JSON.stringify(orderDetails, null, 2));

  console.log("\n=== Test 2: Product with Components ===");
  const productWithComps = await queryEngine.getProductWithAllComponents(
    "PROD-PC"
  );
  console.log(
    "Product with components:",
    JSON.stringify(productWithComps, null, 2)
  );

  console.log("\n=== Test 3: Permission Check ===");
  const permCheck = await queryEngine.checkOrderPermissions(
    "ORD-001",
    "JP",
    "gold"
  );
  console.log("Permission result:", permCheck);

  console.log("\n=== Test 4: Price Calculation ===");
  const priceResult = await queryEngine.calculateOrderPrice("ORD-001");
  console.log("Price calculation:", JSON.stringify(priceResult, null, 2));

  console.log("\n=== Test 5: Permission Check - Cross Country ===");
  queryEngine.clear();
  const permCheckFail = await queryEngine.checkOrderPermissions(
    "ORD-001",
    "CN",
    "gold"
  );
  console.log("Permission result (should fail):", permCheckFail);
}

main().catch(console.error);
