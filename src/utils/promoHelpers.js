/**
 * MAGIZHCHI SPECIAL PRICING SYSTEM
 * Unified Frontend Multi-Buy Promotion pricing calculator.
 * Supports applying promotions across different product variants (e.g. Size M and Size L of same product).
 */
export function calculatePromoPrices(items) {
  if (!items || !Array.isArray(items)) return { items: [], subtotal: 0 };
  
  // Group items by product ID to support multi-buy promotion across variants
  const groups = {};
  items.forEach(item => {
    if (!item?.productId) return;
    const pId = typeof item.productId === 'object' ? (item.productId._id || item.productId.id) : item.productId;
    if (!groups[pId]) {
      groups[pId] = [];
    }
    groups[pId].push(item);
  });
  
  const decoratedItems = [];
  let totalSubtotal = 0;
  
  Object.keys(groups).forEach(pId => {
    const groupItems = groups[pId];
    const product = groupItems[0].productId;
    const isPopulated = typeof product === 'object' && product !== null;
    const basePrice = isPopulated ? (product.discountedPrice || product.sellingPrice || 0) : 0;
    
    const totalQty = groupItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    
    let promoEnabled = false;
    let triggerQty = 0;
    let promoPriceVal = 0;
    
    if (isPopulated && product.multiBuyEnabled && product.multiBuyQuantity > 0 && product.multiBuyPrice > 0) {
      promoEnabled = true;
      triggerQty = product.multiBuyQuantity;
      promoPriceVal = product.multiBuyPrice;
    }
    
    let groupTotal = 0;
    const isPromoTriggered = promoEnabled && totalQty >= triggerQty;
    
    if (isPromoTriggered) {
      const numBundles = Math.floor(totalQty / triggerQty);
      const remainderQty = totalQty % triggerQty;
      groupTotal = (numBundles * promoPriceVal) + (remainderQty * basePrice);
    } else {
      groupTotal = totalQty * basePrice;
    }
    
    // Proportional price distribution to keep unit prices exact and mathematically sound
    const avgPrice = totalQty > 0 ? (groupTotal / totalQty) : basePrice;
    
    groupItems.forEach(item => {
      const itemQty = Number(item.quantity) || 0;
      const itemTotal = parseFloat((avgPrice * itemQty).toFixed(2));
      
      decoratedItems.push({
        ...item,
        calculatedPrice: avgPrice,
        calculatedTotal: itemTotal,
        hasPromoApplied: isPromoTriggered,
        promoDetails: promoEnabled ? { triggerQty, promoPriceVal, basePrice } : null
      });
      totalSubtotal += itemTotal;
    });
  });
  
  return {
    items: decoratedItems,
    subtotal: Math.round(totalSubtotal)
  };
}
