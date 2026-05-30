import { createContext, useContext, useReducer, useEffect } from 'react';
import { adminService } from '../../../services';

const FormContext = createContext();

const initialState = {
  formData: {
    name: '', subtitle: '', slug: '', category: '', subcategory: '', brand: 'Magizhchi',
    sku: '', barcode: '', productType: 'Finished Good', productNature: 'standalone',
    supplier: '', procurementSource: '',
    costPrice: 0, sellingPrice: 0, discountedPrice: 0, wholesalePrice: 0, discountPercentage: 0, discountAmount: 0, gstPercentage: 12,
    multiBuyEnabled: false, multiBuyQuantity: 2, multiBuyPrice: 0,
    lowStockThreshold: 10, warehouseLocation: '', unitType: 'pcs', inventoryTracking: true,
    description: '', tags: [], isFeatured: false, isTrending: false, isActive: true,
    thumbnail: '', images: [], video: '',
    laptopImage: '', tabletImage: '', mobileImage: '', 
    fit: 'cover', cardFit: 'cover', detailFit: 'contain',
    position: 'center', scale: 1, gravity: 'auto', bgStyle: 'ambient',
    variants: [],
    comboSlots: [
       { id: 'slot-1', name: 'Top Wear', products: [], allowedSizes: [], allowedColors: [] },
       { id: 'slot-2', name: 'Bottom Wear', products: [], allowedSizes: [], allowedColors: [] }
    ],
    comboVariants: [], 
    isInventoryProduct: true, isOnlineProduct: true, isBillingProduct: true,
    initialProcurement: {
       supplierId: '',
       billNumber: '',
       billDate: new Date().toISOString().slice(0, 10),
       billImage: '',
       items: [] 
    }
  },
  isUploading: false,
  previewMode: 'laptop'
};

function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, formData: { ...state.formData, [action.field]: action.value } };
    case 'SET_NESTED_FIELD':
      return { 
        ...state, 
        formData: { 
          ...state.formData, 
          [action.parent]: { ...state.formData[action.parent], [action.field]: action.value } 
        } 
      };
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'SET_UPLOADING':
      return { ...state, isUploading: action.value };
    case 'SET_PREVIEW_MODE':
      return { ...state, previewMode: action.value };
    case 'RESET_FORM':
      return { ...initialState };
    default:
      return state;
  }
}

export function FormProvider({ children, initialData }) {
  const [state, dispatch] = useReducer(formReducer, initialState, () => {
    if (!initialData) {
      try {
        const savedDraft = localStorage.getItem('product_draft');
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === 'object') {
            return {
              ...initialState,
              formData: { ...initialState.formData, ...parsed }
            };
          }
        }
      } catch (e) {
        console.error('Failed to parse saved product draft:', e);
      }
    }
    return initialState;
  });

  // Save draft to localStorage reactively on changes (only for new products)
  useEffect(() => {
    if (!initialData) {
      localStorage.setItem('product_draft', JSON.stringify(state.formData));
    }
  }, [state.formData, initialData]);

  const clearDraft = () => {
    localStorage.removeItem('product_draft');
    dispatch({ type: 'RESET_FORM' });
  };

  useEffect(() => {
    if (initialData) {
      // Normalize data for form (e.g., category ID instead of object)
      const normalizedData = { ...initialData };
      if (initialData.category && typeof initialData.category === 'object') {
        normalizedData.category = initialData.category._id || initialData.category.id;
      }
      dispatch({ type: 'SET_FORM_DATA', payload: normalizedData });
    }
  }, [initialData]);

  // Reactive Pricing Sync - Removed aggressive sync that caused rounding loops
  // Logic is now handled directly in the Tab components for better control

  return (
    <FormContext.Provider value={{ state, dispatch, clearDraft }}>
      {children}
    </FormContext.Provider>
  );
}

export const useProductForm = () => useContext(FormContext);
