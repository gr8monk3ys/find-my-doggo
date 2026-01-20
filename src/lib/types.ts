export interface Dog {
  id: string;
  name: string;
  breed: string;
  color: string;
  description: string;
  status: 'lost' | 'found' | 'reunited';
  imageUrl: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  contactEmail: string;
  contactPhone?: string;
  dateReported: string;
}

export interface ReportFormData {
  name: string;
  breed: string;
  color: string;
  description: string;
  status: 'lost' | 'found';
  address: string;
  contactEmail: string;
  contactPhone?: string;
  image?: File;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}
