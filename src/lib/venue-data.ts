export interface VenueProfile {
  venue_id: number;
  venue_name: string;
  address: string;
  lat: number;
  lng: number;
  locality: string;
  zipcode: string;
  country: string;
  country_code: string;
  hotel_unique_id: string;
}

export const VENUES: VenueProfile[] = [
  {
    venue_id: 42,
    venue_name: 'Hotel Berlin Mitte',
    address: 'Friedrichstr. 100, 10117 Berlin, Germany',
    lat: 52.5206,
    lng: 13.3862,
    locality: 'Berlin',
    zipcode: '10117',
    country: 'Germany',
    country_code: 'DE',
    hotel_unique_id: 'BER-MITTE-42',
  },
  {
    venue_id: 55,
    venue_name: 'Grand Hyatt Munich',
    address: 'Brienner Str. 27, 80333 Munich, Germany',
    lat: 48.1435,
    lng: 11.5674,
    locality: 'Munich',
    zipcode: '80333',
    country: 'Germany',
    country_code: 'DE',
    hotel_unique_id: 'MUC-HYATT-55',
  },
  {
    venue_id: 68,
    venue_name: 'Marriott Hamburg',
    address: 'ABC-Str. 52, 20354 Hamburg, Germany',
    lat: 53.5563,
    lng: 9.9839,
    locality: 'Hamburg',
    zipcode: '20354',
    country: 'Germany',
    country_code: 'DE',
    hotel_unique_id: 'HAM-MARR-68',
  },
  {
    venue_id: 81,
    venue_name: 'Radisson Blu Frankfurt',
    address: 'Franklinstr. 65, 60486 Frankfurt, Germany',
    lat: 50.1109,
    lng: 8.6821,
    locality: 'Frankfurt',
    zipcode: '60486',
    country: 'Germany',
    country_code: 'DE',
    hotel_unique_id: 'FRA-RAD-81',
  },
];
