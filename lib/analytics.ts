// lib/analytics.ts

export const pushToDataLayer = (eventName: string, data: any) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...data });
  }
};

export interface GA4Item {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
  item_brand?: string;
  index?: number;
}

// ==========================================
// 1. DOLNA CZĘŚĆ LEJKA (KARTA PRODUKTU I KOSZYK)
// ==========================================

export const trackViewItem = (item: GA4Item, value: number) => {
  pushToDataLayer('view_item', {
    ecommerce: {
      currency: 'PLN',
      value: value,
      items: [item],
    },
  });
};

export const trackAddToCart = (item: GA4Item, value: number) => {
  pushToDataLayer('add_to_cart', {
    ecommerce: {
      currency: 'PLN',
      value: value,
      items: [item],
    },
  });
};

export const trackRemoveFromCart = (item: GA4Item, value: number) => {
  pushToDataLayer('remove_from_cart', {
    ecommerce: {
      currency: 'PLN',
      value: value,
      items: [item],
    },
  });
};

// ==========================================
// 2. GÓRNA CZĘŚĆ LEJKA (ODKRYWANIE I WYSZUKIWANIE)
// ==========================================

export const trackViewItemList = (items: GA4Item[], listId: string, listName: string) => {
  pushToDataLayer('view_item_list', {
    ecommerce: {
      item_list_id: listId,
      item_list_name: listName,
      items: items.map((item, idx) => ({ ...item, index: item.index || idx + 1 })), 
    },
  });
};

export const trackSelectItem = (item: GA4Item, listName: string, index: number) => {
  pushToDataLayer('select_item', {
    ecommerce: {
      item_list_name: listName,
      items: [{ ...item, index }],
    },
  });
};

export const trackViewSearchResults = (searchTerm: string) => {
  pushToDataLayer('view_search_results', {
    search_term: searchTerm
  });
};

// ==========================================
// 3. KOSZYK I ROZPOCZĘCIE CHECKOUTU
// ==========================================

export const trackViewCart = (items: GA4Item[], value: number) => {
  pushToDataLayer('view_cart', {
    ecommerce: {
      currency: 'PLN',
      value: value,
      items: items,
    },
  });
};

export const trackBeginCheckout = (items: GA4Item[], value: number) => {
  pushToDataLayer('begin_checkout', {
    ecommerce: {
      currency: 'PLN',
      value: value,
      items: items,
    },
  });
};

// ==========================================
// 4. IDENTYFIKACJA UŻYTKOWNIKA I GRUPY DOCELOWE
// ==========================================

export const identifyUser = (userId: string, userTier: string, lifetimeValue: number) => {
  pushToDataLayer('set_user_properties', {
    user_id: userId,
    user_properties: {
      customer_tier: userTier,
      ltv: lifetimeValue
    }
  });
};

// ==========================================
// 5. KASA, PŁATNOŚCI I FINALIZACJA (VBB, NCA & FIRST-PARTY DATA)
// ==========================================

export const trackAddShippingInfo = (items: GA4Item[], value: number, shippingTier: string) => {
  pushToDataLayer('add_shipping_info', {
    ecommerce: {
      currency: 'PLN',
      value: value,
      shipping_tier: shippingTier,
      items: items,
    },
  });
};

export const trackAddPaymentInfo = (items: GA4Item[], value: number, paymentType: string) => {
  pushToDataLayer('add_payment_info', {
    ecommerce: {
      currency: 'PLN',
      value: value,
      payment_type: paymentType,
      items: items,
    },
  });
};

export const trackPurchase = (
  items: GA4Item[],
  transactionId: string,
  value: number,
  tax: number,
  shipping: number,
  userData: { email?: string; phone?: string; firstName?: string; lastName?: string; city?: string; zip?: string },
  profitMargin: number,
  isNewCustomer: boolean,
  coupon?: string,
  discount?: number
) => {
  pushToDataLayer('purchase', {
    ecommerce: {
      transaction_id: transactionId,
      value: value,
      tax: tax,
      shipping: shipping,
      currency: 'PLN',
      coupon: coupon,
      discount: discount,
      items: items,
    },
    user_data: {
      email_address: userData.email,
      phone_number: userData.phone,
      address: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        city: userData.city,
        postal_code: userData.zip,
        country: 'PL', 
      }
    },
    profit_margin: profitMargin,
    new_customer: isNewCustomer 
  });
};

// ==========================================
// 6. MIKRO-INTENCJE (PALIWO DLA ALGORYTMÓW)
// ==========================================

export const trackCopySku = (sku: string, productName: string) => {
  pushToDataLayer('copy_sku', {
    item_id: sku,
    item_name: productName,
  });
};

export const trackSupportContact = (contactMethod: 'phone' | 'email') => {
  pushToDataLayer('interact_with_support', {
    contact_method: contactMethod,
  });
};