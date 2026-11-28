import { createContext, useContext, useState } from 'react';
import { CLIENT_PLACEHOLDER_INFO } from '../data/showroomPlaceholders';

const SmartEnquiryContext = createContext({
  enquiryItems: [],
  addHelmetToEnquiry: () => {},
  removeHelmetFromEnquiry: () => {},
  clearEnquiry: () => {},
  isHelmetInEnquiry: () => false,
  generateMultiWhatsAppUrl: () => '',
});

const STORAGE_KEY = 'biker_cafe_multi_enquiry';

export function SmartEnquiryProvider({ children }) {
  const [enquiryItems, setEnquiryItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const save = (items) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const addHelmetToEnquiry = (helmet, size = 'M') => {
    if (!helmet || !helmet.id) return;
    setEnquiryItems((prev) => {
      const existsIndex = prev.findIndex((item) => item.id === helmet.id);
      let next;
      if (existsIndex >= 0) {
        next = prev.map((item, idx) => (idx === existsIndex ? { ...item, size } : item));
      } else {
        next = [
          ...prev,
          {
            id: helmet.id,
            title: helmet.title,
            category: helmet.category,
            priceLabel: helmet.priceLabel,
            certification: helmet.certification,
            size,
          },
        ];
      }
      save(next);
      return next;
    });
  };

  const removeHelmetFromEnquiry = (helmetId) => {
    setEnquiryItems((prev) => {
      const next = prev.filter((item) => item.id !== helmetId);
      save(next);
      return next;
    });
  };

  const clearEnquiry = () => {
    setEnquiryItems([]);
    save([]);
  };

  const isHelmetInEnquiry = (helmetId) => enquiryItems.some((item) => item.id === helmetId);

  const generateMultiWhatsAppUrl = (customerName = '', notes = '') => {
    if (enquiryItems.length === 0) return CLIENT_PLACEHOLDER_INFO.whatsappUrl;

    let text = `Hello BIKER CAFE (${CLIENT_PLACEHOLDER_INFO.locationLabel}), I would like to check availability and confirm details for the following helmets:\n\n`;

    enquiryItems.forEach((item, index) => {
      text += `${index + 1}. *${item.title}*\n`;
      text += `   - Category: ${item.category}\n`;
      if (item.priceLabel) text += `   - Reference MRP: ${item.priceLabel}\n`;
      if (item.certification) text += `   - Standard: ${item.certification}\n`;
      if (item.size) text += `   - Preferred Size: ${item.size}\n`;
      text += '\n';
    });

    if (customerName) {
      text += `Customer Name: ${customerName}\n`;
    }
    if (notes) {
      text += `Note: ${notes}\n`;
    }

    text += `\nPlease confirm current in-store stock, available graphics, and showroom pricing. Thank you!`;

    return `${CLIENT_PLACEHOLDER_INFO.whatsappUrl}?text=${encodeURIComponent(text)}`;
  };

  return (
    <SmartEnquiryContext.Provider
      value={{
        enquiryItems,
        addHelmetToEnquiry,
        removeHelmetFromEnquiry,
        clearEnquiry,
        isHelmetInEnquiry,
        generateMultiWhatsAppUrl,
      }}
    >
      {children}
    </SmartEnquiryContext.Provider>
  );
}

export function useSmartEnquiry() {
  return useContext(SmartEnquiryContext);
}
