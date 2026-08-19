export type DogStatus = 'lost' | 'found' | 'reunited';

/** A dog as returned by the public API. Contact details are deliberately absent. */
export interface Dog {
  id: string;
  name: string;
  breed: string;
  color: string;
  description: string;
  status: DogStatus;
  imageUrl: string | null;
  location: {
    address: string;
    lat: number | null;
    lng: number | null;
  };
  dateReported: string;
}

/** A dog including the reporter's contact details. Server-side only. */
export interface DogWithContact extends Dog {
  contactEmail: string;
  contactPhone: string | null;
}

export interface DogListFilters {
  status?: DogStatus;
  query?: string;
  limit?: number;
}
