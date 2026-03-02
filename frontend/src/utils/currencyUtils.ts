
export const CURRENCY_MAP: Record<string, string> = {
  USD: 'United States Dollar',
  EUR: 'Euro',
  JPY: 'Japanese Yen',
  GBP: 'British Pound Sterling',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
  HKD: 'Hong Kong Dollar',
  NZD: 'New Zealand Dollar',
  SEK: 'Swedish Krona',
  KRW: 'South Korean Won',
  SGD: 'Singapore Dollar',
  NOK: 'Norwegian Krone',
  MXN: 'Mexican Peso',
  INR: 'Indian Rupee',
  RUB: 'Russian Ruble',
  ZAR: 'South African Rand',
  TRY: 'Turkish Lira',
  BRL: 'Brazilian Real',
  TWD: 'New Taiwan Dollar',
  DKK: 'Danish Krone',
  PLN: 'Polish Zloty',
  THB: 'Thai Baht',
  IDR: 'Indonesian Rupiah',
  HUF: 'Hungarian Forint',
  CZK: 'Czech Koruna',
  ILS: 'Israeli New Shekel',
  CLP: 'Chilean Peso',
  PHP: 'Philippine Peso',
  AED: 'United Arab Emirates Dirham',
  COP: 'Colombian Peso',
  SAR: 'Saudi Riyal',
  MYR: 'Malaysian Ringgit',
  RON: 'Romanian Leu',
  VND: 'Vietnamese Dong',
  ARS: 'Argentine Peso',
  IQD: 'Iraqi Dinar',
  KWD: 'Kuwaiti Dinar',
  NIO: 'Nicaraguan Córdoba',
  PEN: 'Peruvian Sol',
  QAR: 'Qatari Riyal',
  KZT: 'Kazakhstani Tenge',
  EGP: 'Egyptian Pound',
  OMR: 'Omani Rial',
  JOD: 'Jordanian Dinar',
  BHD: 'Bahraini Dinar',
  DZD: 'Algerian Dinar',
  MAD: 'Moroccan Dirham',
  UAH: 'Ukrainian Hryvnia',
  PKR: 'Pakistani Rupee',
  LKR: 'Sri Lankan Rupee',
  BDT: 'Bangladeshi Taka',
  NGN: 'Nigerian Naira',
  KES: 'Kenyan Shilling',
  GHS: 'Ghanaian Cedi',
  TZS: 'Tanzanian Shilling',
  UGX: 'Ugandan Shilling',
  XOF: 'West African CFA Franc',
  XAF: 'Central African CFA Franc',
  MZN: 'Mozambican Metical',
  ETB: 'Ethiopian Birr',
  // Add more as needed, this covers major ones
};

export const POPULAR_CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'CNY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD'];

export interface ConversionResult {
  amount: number;
  rate: number;
  date: string;
}

const RATE_CACHE: Record<string, { rate: number, timestamp: number }> = {};
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function fetchExchangeRate(from: string, to: string): Promise<number | null> {
  const pair = `${from}_${to}`;
  const now = Date.now();

  if (RATE_CACHE[pair] && now - RATE_CACHE[pair].timestamp < CACHE_DURATION) {
    return RATE_CACHE[pair].rate;
  }

  try {
    // Using frankfurter.app which is free and open source
    const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    if (!response.ok) {
        // Fallback or error handling
        // Frankfurter might not support all currencies in the map, but it supports most majors.
        // If it fails, we return null.
        return null;
    }
    const data = await response.json();
    const rate = data.rates[to];
    
    if (rate) {
      RATE_CACHE[pair] = { rate, timestamp: now };
      return rate;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    return null;
  }
}

export function isValidCurrency(currency: string): boolean {
    return currency.toUpperCase() in CURRENCY_MAP;
}
