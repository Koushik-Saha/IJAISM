import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
                    <h1 className="text-4xl font-bold text-primary mb-8">Privacy Policy</h1>

                    <div className="prose prose-blue max-w-none text-gray-700">
                        <p className="lead">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <h3>1. Information We Collect</h3>
                        <p>
                            We collect information you provide directly to us, such as when you create an account,
                            submit a manuscript, or communicate with us. This may include your name, email address,
                            academic affiliation, and research interests.
                        </p>

                        <h3>2. How We Use Your Information</h3>
                        <p>
                            We use the information we collect to operate and improve our platform, facilitate the
                            peer review process, communicate with you, and personalize your experience.
                        </p>

                        <h3>3. Data Sharing</h3>
                        <p>
                            We do not sell your personal information. We may share your information with trusted
                            third-party service providers (such as Stripe for payments) who assist us in operating
                            our platform.
                        </p>

                        <h3>4. Cookies and Tracking</h3>
                        <p>
                            We use cookies and similar tracking technologies to track the activity on our service
                            and hold certain information. You can instruct your browser to refuse all cookies or
                            to indicate when a cookie is being sent.
                        </p>

                        <h3>5. Data Security</h3>
                        <p>
                            We implement appropriate technical and organizational measures to protect your personal
                            data against unauthorized access, alteration, disclosure, or destruction.
                        </p>

                        <h3>6. Your Rights</h3>
                        <p>
                            You have the right to access, update, or delete your personal information. You can
                            manage your account settings directly through your dashboard.
                        </p>

                        <h3>7. Contact Us</h3>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at{' '}
                            <Link href="/contact" className="text-primary hover:underline">
                                privacy@ijaism.org
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
