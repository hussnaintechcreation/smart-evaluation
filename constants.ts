import type { TechCategory } from './types';

export const techStackData: TechCategory[] = [
  {
    title: 'Frontend',
    items: [
      { name: 'React (TypeScript)', description: 'UI library for building component-based interfaces.' },
      { name: 'Tailwind CSS', description: 'A utility-first CSS framework for rapid UI development.' },
      { name: 'React Three Fiber', description: 'A React renderer for Three.js to build 3D UIs.' },
      { name: 'Framer Motion', description: 'A production-ready motion library for React.' },
      { name: 'State Management', description: 'React Query/SWR for server state, Zustand/Redux for global state.' },
    ],
  },
  {
    title: 'Backend',
    items: [
      { name: 'Node.js (NestJS / Express)', description: 'Scalable server-side applications with TypeScript.' },
      { name: 'PostgreSQL (NeonDB)', description: 'Powerful, open-source object-relational database system.' },
      { name: 'Prisma / TypeORM', description: 'Next-generation ORM for Node.js and TypeScript.' },
      { name: 'REST & GraphQL APIs', description: 'Flexible and robust API design patterns.' },
    ],
  },
  {
    title: 'AI Layer',
    items: [
      { name: 'Google GenAI', description: 'Language models for transcription and analysis (Live & Batch).' },
      { name: 'Response Schemas', description: 'Ensuring structured, reliable JSON output from AI models.' },
      { name: 'Background Processing', description: 'BullMQ/Redis for handling asynchronous AI analysis jobs.' },
    ],
  },
  {
    title: 'Realtime',
    items: [
      { name: 'WebRTC', description: 'Peer-to-peer communication for video and audio streaming.' },
      { name: 'WebSockets (Socket.IO)', description: 'Persistent, bi-directional communication for live events.' },
    ],
  },
  {
    title: 'Infrastructure',
    items: [
      { name: 'Hosting (Vercel/Render)', description: 'Seamless deployments for frontend and backend services.' },
      { name: 'Media Storage (S3)', description: 'Scalable object storage for video, audio, and assets.' },
      { name: 'Queues (Redis/BullMQ)', description: 'In-memory data store for background job processing.' },
      { name: 'CI/CD (GitHub Actions)', description: 'Automated builds, testing, and deployments.' },
      { name: 'Monitoring', description: 'Sentry, Prometheus, or Datadog for observability.' },
    ],
  },
  {
    title: 'Security & Testing',
    items: [
      { name: 'Data Encryption', description: 'Protecting sensitive data (like CNIC) at rest and in transit.' },
      { name: 'Role-Based Access Control', description: 'Fine-grained permission control for different user roles.' },
      { name: 'API Security', description: 'Rate limiting and abuse detection for all endpoints.' },
      { name: 'Comprehensive Testing', description: 'Unit, Integration, and E2E (Cypress) tests for reliability.' },
      { name: 'Audit Logs', description: 'Tracking important changes and actions within the system.' },
    ],
  },
    {
    title: 'Roadmap',
    items: [
      { name: 'MVP', description: 'Core auth, candidate profiles, basic interview flow, and initial AI analysis.' },
      { name: 'Phase 2', description: 'Real-time transcription, robust background jobs, analytics, and improved UX.' },
      { name: 'Phase 3', description: 'Advanced 3D UI, enhanced AI features, multi-org support, and infrastructure scaling.' },
    ],
  },
];
