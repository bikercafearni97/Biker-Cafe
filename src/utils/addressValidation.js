/**
 * Customer Address Validation Utilities - Stage 6.6
 *
 * Required fields:
 * - fullName (2 - 80 chars)
 * - phone (10-digit Indian mobile number)
 * - houseNo (1 - 60 chars)
 * - street (2 - 120 chars)
 * - area (2 - 100 chars)
 * - city (2 - 60 chars)
 * - district (2 - 60 chars)
 * - state (2 - 60 chars)
 * - pinCode (6-digit Indian PIN code)
 *
 * Optional fields:
 * - altPhone (10-digit Indian mobile number or empty)
 * - landmark (max 100 chars)
 * - instructions (max 250 chars)
 * - label ('home' | 'work' | 'other')
 * - isDefault (boolean)
 */

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

export function cleanPhone(phone) {
  if (!phone) return '';
  return phone.toString().replace(/\D/g, '').slice(-10);
}

export function isValidIndianMobile(phone) {
  const cleaned = cleanPhone(phone);
  // Valid Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function isValidIndianPinCode(pin) {
  if (!pin) return false;
  const cleaned = pin.toString().trim();
  // 6 digits, cannot start with 0
  return /^[1-9][0-9]{5}$/.test(cleaned);
}

export function validateAddress(address) {
  const errors = {};

  if (!address.fullName || address.fullName.trim().length < 2) {
    errors.fullName = 'Full name is required (min 2 characters)';
  } else if (address.fullName.trim().length > 80) {
    errors.fullName = 'Full name cannot exceed 80 characters';
  }

  if (!address.phone) {
    errors.phone = 'Mobile number is required';
  } else if (!isValidIndianMobile(address.phone)) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
  }

  if (address.altPhone && address.altPhone.trim() !== '') {
    if (!isValidIndianMobile(address.altPhone)) {
      errors.altPhone = 'Enter a valid 10-digit alternate mobile number';
    } else if (cleanPhone(address.altPhone) === cleanPhone(address.phone)) {
      errors.altPhone = 'Alternate mobile number must be different from primary mobile';
    }
  }

  if (!address.houseNo || address.houseNo.trim().length < 1) {
    errors.houseNo = 'House / Door / Building number is required';
  } else if (address.houseNo.trim().length > 60) {
    errors.houseNo = 'House / Door number cannot exceed 60 characters';
  }

  if (!address.street || address.street.trim().length < 2) {
    errors.street = 'Street / Road name is required';
  } else if (address.street.trim().length > 120) {
    errors.street = 'Street name cannot exceed 120 characters';
  }

  if (!address.area || address.area.trim().length < 2) {
    errors.area = 'Area / Locality is required';
  } else if (address.area.trim().length > 100) {
    errors.area = 'Area cannot exceed 100 characters';
  }

  if (!address.city || address.city.trim().length < 2) {
    errors.city = 'City / Town is required';
  } else if (address.city.trim().length > 60) {
    errors.city = 'City cannot exceed 60 characters';
  }

  if (!address.district || address.district.trim().length < 2) {
    errors.district = 'District is required';
  } else if (address.district.trim().length > 60) {
    errors.district = 'District cannot exceed 60 characters';
  }

  if (!address.state || address.state.trim().length < 2) {
    errors.state = 'State is required';
  }

  if (!address.pinCode) {
    errors.pinCode = '6-digit PIN code is required';
  } else if (!isValidIndianPinCode(address.pinCode)) {
    errors.pinCode = 'Enter a valid 6-digit Indian PIN code (e.g. 632301)';
  }

  if (address.landmark && address.landmark.trim().length > 100) {
    errors.landmark = 'Landmark cannot exceed 100 characters';
  }

  if (address.instructions && address.instructions.trim().length > 250) {
    errors.instructions = 'Delivery instructions cannot exceed 250 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatAddressOneLine(addr) {
  if (!addr) return '';
  const parts = [
    addr.houseNo,
    addr.street,
    addr.area,
    addr.landmark ? `Near ${addr.landmark}` : null,
    addr.city,
    addr.district,
    addr.state ? `${addr.state} - ${addr.pinCode}` : addr.pinCode,
  ].filter(Boolean);
  return parts.join(', ');
}
