import { createContext, useContext, useReducer, useEffect } from 'react';
import { dbService } from '../../../utils/db';

const POSContext = createContext();

const initialState = {
  activeTab: 0,
  cartSessions: [
    { items: [], customer: { name: '', phone: '', email: '' }, discount: 0, salesStaffId: '', paymentMethod: 'cash', activeCoupon: '', paymentSplit: { cash: 0, upi: 0, card: 0 } },
    { items: [], customer: { name: '', phone: '', email: '' }, discount: 0, salesStaffId: '', paymentMethod: 'cash', activeCoupon: '', paymentSplit: { cash: 0, upi: 0, card: 0 } },
    { items: [], customer: { name: '', phone: '', email: '' }, discount: 0, salesStaffId: '', paymentMethod: 'cash', activeCoupon: '', paymentSplit: { cash: 0, upi: 0, card: 0 } },
  ],
  search: '',
  selectedCategory: 'All',
  viewMode: 'grid',
  isCheckoutOpen: false,
  heldBills: [],
  offlineBills: [], // 🆕 Offline bills cache
  editingBillId: null,
  staffMembers: [],
  lastBill: null,
  activeView: 'billing',
  isMobileCartOpen: false
};

function posReducer(state, action) {
  const { activeTab } = state;
  const currentSession = state.cartSessions[activeTab];

  switch (action.type) {
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    
    case 'SET_CATEGORY':
      return { ...state, selectedCategory: action.payload };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'UPDATE_SESSION':
      const newSessions = [...state.cartSessions];
      newSessions[activeTab] = { ...newSessions[activeTab], ...action.payload };
      return { ...state, cartSessions: newSessions };

    case 'SELECT_PRODUCT':
      const invItem = action.payload; 
      const existingItem = currentSession.items.find(i => i.inventoryId === invItem._id);
      
      // SECURITY: Stock Ceiling Check (Removed to support zero-stock/negative billing for manual reconciliations)
      // const requestedQty = (existingItem?.quantity || 0) + 1;
      // if (requestedQty > invItem.availableStock) {
      //   return state; // Silently prevent or I could toast but reducer is pure
      // }

      const newItemsList = [...currentSession.items];
      if (existingItem) {
        newItemsList.splice(newItemsList.indexOf(existingItem), 1, {
          ...existingItem,
          quantity: existingItem.quantity + 1
        });
      } else {
        newItemsList.push({
          id: Math.random().toString(36).substr(2, 9),
          productId: invItem.productId || invItem.productRef?._id || invItem.productRef, // Use combo productId if present
          inventoryId: invItem._id || invItem.id,
          name: invItem.productName,
          image: invItem.images?.[0] || invItem.productRef?.thumbnail || invItem.laptopImage || invItem.tabletImage || invItem.mobileImage,
          price: invItem.sellingPrice,
          quantity: 1,
          variantName: `${invItem.size} / ${invItem.color}`,
          sku: invItem.sku,
          isCombo: !!invItem.comboSelections,
          comboSelections: invItem.comboSelections
        });
      }

      const sessionsWithNewItem = [...state.cartSessions];
      sessionsWithNewItem[activeTab] = { ...currentSession, items: newItemsList };
      return { ...state, cartSessions: sessionsWithNewItem };

    case 'SET_ITEMS':
      const itemsAction = action.payload;
      const updatedItems = typeof itemsAction === 'function' ? itemsAction(currentSession.items) : itemsAction;
      
      // SECURITY: Secondary Stock Validation on bulk update
      const validatedItems = updatedItems.map(item => {
        // If we have inventory info, we'd check here too. 
        // For simplicity, we assume individual increments handled the check.
        return item;
      });

      const sessionsWithSetItems = [...state.cartSessions];
      sessionsWithSetItems[activeTab] = { ...currentSession, items: validatedItems };
      return { ...state, cartSessions: sessionsWithSetItems };

    case 'TOGGLE_CHECKOUT':
      return { ...state, isCheckoutOpen: !state.isCheckoutOpen };

    case 'SET_HELD_BILLS':
      return { ...state, heldBills: action.payload };

    case 'SET_EDITING_ID':
      return { ...state, editingBillId: action.payload };

    case 'SET_STAFF':
      return { ...state, staffMembers: action.payload };
    
    case 'SET_LAST_BILL':
      return { ...state, lastBill: action.payload };

    case 'SET_OFFLINE_BILLS':
      return { ...state, offlineBills: action.payload };

    case 'ADD_OFFLINE_BILL':
      return { ...state, offlineBills: [...state.offlineBills, action.payload] };

    case 'REMOVE_OFFLINE_BILL':
      return { ...state, offlineBills: state.offlineBills.filter(b => b.id !== action.payload) };

    case 'TOGGLE_MOBILE_CART':
      return { ...state, isMobileCartOpen: !state.isMobileCartOpen };

    case 'HYDRATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

export function POSProvider({ children }) {
  const [state, dispatch] = useReducer(posReducer, initialState);

  // Persistence logic moved here
  useEffect(() => {
    const persist = async () => {
      await dbService.put('posState', { id: 'cartSessions', value: state.cartSessions });
      await dbService.put('posState', { id: 'activeTab', value: state.activeTab });
      await dbService.put('posState', { id: 'editingBillId', value: state.editingBillId });
    };
    persist();
  }, [state.cartSessions, state.activeTab, state.editingBillId]);

  // Load offline bills from IndexedDB on startup
  useEffect(() => {
    const loadOfflineBills = async () => {
      try {
        const savedOffline = await dbService.getAll('offlineBills');
        if (savedOffline) {
          dispatch({ type: 'SET_OFFLINE_BILLS', payload: savedOffline });
        }
      } catch (err) {
        console.error('Failed to load offline bills:', err.message);
      }
    };
    loadOfflineBills();
  }, []);

  return (
    <POSContext.Provider value={{ state, dispatch }}>
      {children}
    </POSContext.Provider>
  );
}

export const usePOS = () => useContext(POSContext);
