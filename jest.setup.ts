import '@testing-library/jest-dom'

// Mock Swiper to avoid ESM issues
jest.mock('swiper/react', () => ({
    Swiper: ({ children }: { children: React.ReactNode }) => children,
    SwiperSlide: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('swiper/modules', () => ({
    Navigation: jest.fn(),
    Pagination: jest.fn(),
    Autoplay: jest.fn(),
}));

jest.mock('swiper/css', () => jest.fn());
jest.mock('swiper/css/navigation', () => jest.fn());
jest.mock('swiper/css/pagination', () => jest.fn());
