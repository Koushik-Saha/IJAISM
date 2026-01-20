"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ConferenceProps {
    conference: {
        id: string;
        title: string;
        acronym: string | null;
        fullDescription: string | null;
        startDate: Date;
        endDate: Date;
        location: string | null;
        venue: string | null;
        conferenceType: string | null;
        status: string;
        topics: string[];
        keynotes: any[];
        schedule: any[];
        registrationFees: any;
        included: string[];
        importantDates: any[];
        venueDetails: any;
    }
}

export default function ConferenceClient({ conference }: ConferenceProps) {
    const router = useRouter();
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [downloadingBrochure, setDownloadingBrochure] = useState(false);

    // Format dates helper
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const handleDownloadBrochure = () => {
        setDownloadingBrochure(true);
        setTimeout(() => {
            alert("Brochure download would start here. In production, this would download the actual conference brochure PDF.");
            setDownloadingBrochure(false);
        }, 1000);
    };

    const handleRegistration = async (formData: any) => {
        try {
            const response = await fetch('/api/conferences/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conferenceId: conference.id,
                    ...formData
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Registration successful!');
                setShowRegistrationForm(false);
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-block bg-white/20 px-4 py-1 rounded-full text-sm font-bold">
                            {conference.status}
                        </span>
                        <span className="inline-block bg-accent px-4 py-1 rounded-full text-sm font-bold">
                            {conference.conferenceType}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{conference.title}</h1>
                    {conference.acronym && <p className="text-2xl mb-6">{conference.acronym}</p>}
                    <div className="flex flex-wrap gap-6 text-lg">
                        <div className="flex items-center">
                            <span className="mr-2">📅</span>
                            <span>
                                {formatDate(conference.startDate)} - {formatDate(conference.endDate)}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <span className="mr-2">📍</span>
                            <span>{conference.location}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="mr-2">🏢</span>
                            <span>{conference.venue}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>

                            <div className="space-y-3 mb-6">
                                <button
                                    onClick={() => setShowRegistrationForm(true)}
                                    className="w-full bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Register Now
                                </button>

                                <button
                                    onClick={handleDownloadBrochure}
                                    disabled={downloadingBrochure}
                                    className="w-full border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                                >
                                    {downloadingBrochure ? 'Downloading...' : 'Download Brochure'}
                                </button>

                                <Link
                                    href="/submit"
                                    className="block w-full text-center border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Submit Paper
                                </Link>
                            </div>

                            {/* Important Dates */}
                            {conference.importantDates && conference.importantDates.length > 0 && (
                                <div className="border-t border-gray-200 pt-6 mb-6">
                                    <h4 className="font-bold text-gray-800 mb-3">Important Dates</h4>
                                    <div className="space-y-2">
                                        {conference.importantDates.map((item: any, index: number) => (
                                            <div key={index} className="text-sm">
                                                <p className="text-gray-600">{item.event}</p>
                                                <p className="font-semibold text-gray-800">{item.date}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contact */}
                            <div className="border-t border-gray-200 pt-6">
                                <h4 className="font-bold text-gray-800 mb-3">Contact</h4>
                                <p className="text-sm text-gray-600 mb-2">
                                    For inquiries, please contact:
                                </p>
                                <p className="text-sm text-primary font-semibold">
                                    conference@c5k.com
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* About */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-3xl font-bold text-primary mb-4">About the Conference</h2>
                            <div className="text-gray-700 leading-relaxed space-y-4">
                                {conference.fullDescription
                                    ? conference.fullDescription.split('\n\n').map((paragraph: string, index: number) => (
                                        <p key={index}>{paragraph.trim()}</p>
                                    ))
                                    : <p>No description available.</p>
                                }
                            </div>
                        </div>

                        {/* Topics */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-3xl font-bold text-primary mb-4">Key Topics</h2>
                            <div className="flex flex-wrap gap-2">
                                {conference.topics.map((topic: string, index: number) => (
                                    <span
                                        key={index}
                                        className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg"
                                    >
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Keynote Speakers */}
                        {conference.keynotes && conference.keynotes.length > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-8">
                                <h2 className="text-3xl font-bold text-primary mb-6">Keynote Speakers</h2>
                                <div className="space-y-6">
                                    {conference.keynotes.map((keynote: any, index: number) => (
                                        <div key={index} className="border-l-4 border-accent pl-6">
                                            <h3 className="text-xl font-bold text-gray-800">{keynote.name}</h3>
                                            <p className="text-gray-600 mb-2">{keynote.title}</p>
                                            <p className="text-gray-800 font-semibold">{keynote.topic}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Schedule */}
                        {conference.schedule && conference.schedule.length > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-8">
                                <h2 className="text-3xl font-bold text-primary mb-6">Conference Schedule</h2>
                                <div className="space-y-6">
                                    {conference.schedule.map((day: any, dayIndex: number) => (
                                        <div key={dayIndex}>
                                            <h3 className="text-xl font-bold text-gray-800 mb-4">{day.day}</h3>
                                            <div className="space-y-3">
                                                {day.events.map((event: any, eventIndex: number) => (
                                                    <div key={eventIndex} className="flex border-b border-gray-200 pb-3">
                                                        <div className="w-32 flex-shrink-0 text-primary font-semibold">
                                                            {event.time}
                                                        </div>
                                                        <div className="flex-1 text-gray-800">{event.event}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Registration Fees */}
                        {conference.registrationFees && (
                            <div className="bg-white rounded-lg shadow-md p-8">
                                <h2 className="text-3xl font-bold text-primary mb-6">Registration Fees</h2>
                                <div className="space-y-6">
                                    {Object.entries(conference.registrationFees).map(([key, value]: [string, any]) => (
                                        <div key={key} className="border-l-4 border-accent pl-6">
                                            <h3 className="text-xl font-bold text-gray-800 capitalize mb-2">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </h3>
                                            <p className="text-gray-600 mb-3">{value.period}</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-600">In-Person</p>
                                                    <p className="text-2xl font-bold text-accent">{value.inPerson}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Virtual</p>
                                                    <p className="text-2xl font-bold text-accent">{value.virtual}</p>
                                                </div>
                                            </div>
                                            {value.student && (
                                                <p className="text-sm text-gray-600 mt-2">Student Discount: {value.student}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* What's Included */}
                        {conference.included && conference.included.length > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-8">
                                <h2 className="text-3xl font-bold text-primary mb-6">Registration Includes</h2>
                                <ul className="grid md:grid-cols-2 gap-3">
                                    {conference.included.map((item: string, index: number) => (
                                        <li key={index} className="flex items-start">
                                            <span className="text-accent mr-2 mt-1">✓</span>
                                            <span className="text-gray-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Venue */}
                        {conference.venueDetails && (
                            <div className="bg-white rounded-lg shadow-md p-8">
                                <h2 className="text-3xl font-bold text-primary mb-6">Venue Information</h2>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{conference.venueDetails.name}</h3>
                                <p className="text-gray-600 mb-4">{conference.venueDetails.address}</p>
                                <p className="text-gray-700 mb-6">{conference.venueDetails.description}</p>

                                {conference.venueDetails.hotels && (
                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-3">Nearby Hotels</h4>
                                        <div className="space-y-3">
                                            {conference.venueDetails.hotels.map((hotel: any, index: number) => (
                                                <div key={index} className="flex justify-between items-center border-b border-gray-200 pb-3">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{hotel.name}</p>
                                                        <p className="text-sm text-gray-600">{hotel.distance}</p>
                                                    </div>
                                                    <p className="text-accent font-semibold">{hotel.rate}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Back Button */}
                <div className="mt-8">
                    <Link
                        href="/conferences"
                        className="inline-flex items-center text-primary hover:text-accent font-semibold"
                    >
                        ← Back to All Conferences
                    </Link>
                </div>
            </div>

            {/* Registration Modal */}
            {showRegistrationForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-800">Conference Registration</h3>
                            <button
                                onClick={() => setShowRegistrationForm(false)}
                                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-8">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = {
                                        name: (e.target as any).fullName.value,
                                        email: (e.target as any).email.value,
                                        organization: (e.target as any).organization.value,
                                        type: (e.target as any).registrationType.value,
                                        attendance: (e.target as any).attendanceType.value
                                    };
                                    handleRegistration(formData);
                                }}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                                        placeholder="Enter your email"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Organization *
                                    </label>
                                    <input
                                        type="text"
                                        name="organization"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                                        placeholder="Enter your organization"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Registration Type *
                                    </label>
                                    <select
                                        name="registrationType"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                                    >
                                        <option value="">Select type</option>
                                        <option value="academic">Academic/Researcher</option>
                                        <option value="industry">Industry Professional</option>
                                        <option value="student">Student</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Attendance Type *
                                    </label>
                                    <select
                                        name="attendanceType"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                                    >
                                        <option value="">Select attendance type</option>
                                        <option value="inperson">In-Person</option>
                                        <option value="virtual">Virtual</option>
                                    </select>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowRegistrationForm(false)}
                                        className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-bold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-bold transition-colors"
                                    >
                                        Submit Registration
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
