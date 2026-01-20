# Find My Doggo

A community-powered platform to help reunite lost dogs with their families through photo sharing and location mapping.

## Features

- **Report Lost/Found Dogs** - Submit detailed reports with photos and location information
- **Dog Gallery** - Browse and search through lost and found dog listings with filters
- **Map View** - Visual representation of dogs on an interactive map
- **Contact System** - Easy way to connect with pet owners or finders

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gr8monk3ys/find-my-doggo.git
   cd find-my-doggo
   ```

2. Install dependencies:
   ```bash
   cd website
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
website/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Home page
│   │   ├── dogs/             # Dog gallery page
│   │   ├── map/              # Map view page
│   │   ├── report/           # Report form page
│   │   └── contact/          # Contact page
│   ├── components/
│   │   ├── Navbar.tsx        # Navigation component
│   │   ├── Footer.tsx        # Footer component
│   │   └── DogCard.tsx       # Dog listing card
│   └── lib/
│       ├── types.ts          # TypeScript types
│       └── mockData.ts       # Sample dog data
└── public/                   # Static assets
```

## Future Enhancements

- Database integration (Firebase/Supabase)
- Real map integration (Google Maps/Mapbox)
- User authentication
- Email notifications
- ML-based dog breed recognition
- Image upload to cloud storage

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.
