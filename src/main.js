const REQUIRED_DATA_KEYS = ['customers', 'products', 'sellers', 'purchase_records'];

/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет прибыли от операции
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
  const totalPercent = {
    0: 0.15,
    1: 0.1,
    2: 0.1,
    total: 0.05
  }
  if (index !== (total - 1)) {
    const bonus_rate = totalPercent[index] ?? totalPercent.total;
    return seller.profit * bonus_rate;
  }
  return 0;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {

  if (
    !(data &&
      Object.entries(data).every(([key, value]) =>
          REQUIRED_DATA_KEYS.includes(key) &&
          Array.isArray(value) &&
          value.length > 0
      ))
  ) {
    throw new Error('Uncorrected data');
  }

  const { calculateRevenue, calculateBonus } = options;
  if (
    !(typeof calculateRevenue === "function" ||
      typeof calculateBonus === "function"
  )) {
    throw new Error('Options are not defined');
  }

  const sellerIndex = Object.fromEntries(
    data.sellers.map(seller => [
      seller.id,
      {
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        top_products: [],
        bonus: 0,
        products_sold: {}
      }
    ])
  );

  const productIndex = Object.fromEntries(
    data.products.map(product => [product.sku, product])
  );
  data.purchase_records.forEach(record => {
    const seller = sellerIndex[record.seller_id];
    seller.sales_count++;
    record.items.forEach(item => {
      const product = productIndex[item.sku];
      seller.revenue += item.quantity * item.sale_price * (1 - item.discount / 100);
      seller.profit += item.quantity * item.sale_price * (1 - item.discount / 100) - product.purchase_price * item.quantity;
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
    });
  });
  const resultData = Object.values(sellerIndex).sort((seller1, seller2) => seller2.profit - seller1.profit)
  resultData.forEach((seller, index) => {
    seller.top_products = Object.entries(seller.products_sold).sort((product1, product2) => product2[1] - product1[1]).slice(0, 10)
    seller.bonus = calculateBonus(index, resultData.length, seller);
    seller.revenue = parseFloat(seller.revenue.toFixed(2));
    seller.profit = parseFloat(seller.profit.toFixed(2));
    seller.bonus = parseFloat(seller.bonus.toFixed(2));
    delete seller.products_sold;
  })
  return resultData;
}
