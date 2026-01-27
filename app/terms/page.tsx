import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
                    <h1 className="text-4xl font-bold text-primary mb-8">Terms of Service</h1>

                    <div className="prose prose-blue max-w-none text-gray-700">
                        <p className="lead">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <h3>1. Introduction</h3>
                        <p>
                            Welcome to C5K. By accessing or using our platform, you agree to be bound by these
                            Terms of Service and all applicable laws and regulations.
                        </p>

                        <h3>2. User Accounts</h3>
                        <p>
                            To access certain features of the platform, you may be required to register for an
                            account. You agree to provide accurate, current, and complete information during the
                            registration process and to update such information to keep it accurate, current, and
                            complete.
                        </p>

                        <h3>3. Academic Integrity</h3>
                        <p>
                            Users agree to uphold the highest standards of academic integrity. Plagiarism, data
                            fabrication, and other forms of academic misconduct are strictly prohibited and will
                            result in immediate account termination.
                        </p>

                        <h3>4. Intellectual Property</h3>
                        <p>
                            Authors retain the copyright to their work published on C5K. By submitting content,
                            you grant C5K a non-exclusive license to publish, archive, and distribute your work.
                        </p>

                        <h3>5. Peer Review Process</h3>
                        <p>
                            Authors and reviewers agree to participate in the peer review process in good faith,
                            providing constructive feedback and respecting confidentiality.
                        </p>

                        <h3>6. Modifications</h3>
                        <p>
                            We reserve the right to modify these terms at any time. We will notify users of any
                            significant changes by posting a notice on our website.
                        </p>

                        <h3>7. Contact Us</h3>
                        <p>
                            If you have any questions about these Terms, please contact us at{' '}
                            <Link href="/contact" className="text-primary hover:underline">
                                support@c5k.org
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
