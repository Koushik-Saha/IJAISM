import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
                    <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                    <div className="prose prose-blue max-w-none">
                        <p>
                            At C5K ("we", "us", "our"), we are committed to protecting your personal information and your right to privacy.
                            This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our website.
                        </p>

                        <h3>1. Information We Collect</h3>
                        <p>
                            We collect personal information that you voluntarily provide to us when you register on the website,
                            submit articles, or communicate with us. This includes:
                        </p>
                        <ul>
                            <li>Name and Contact Data (Email, phone number)</li>
                            <li>Credentials (Passwords, security information)</li>
                            <li>Professional Data (Affiliation, University, Orcid ID)</li>
                        </ul>

                        <h3>2. How We Use Your Information</h3>
                        <p>We use your personal information for these purposes:</p>
                        <ul>
                            <li>To facilitate account creation and logon process.</li>
                            <li>To manage accurate peer review and publication records.</li>
                            <li>To send administrative information to you.</li>
                            <li>To protect our sites.</li>
                        </ul>

                        <h3>3. Sharing Your Information</h3>
                        <p>
                            We only share information with your consent, to comply with laws, to provide you with services,
                            to protect your rights, or to fulfill business obligations.
                        </p>

                        <h3>4. Your Privacy Rights (GDPR)</h3>
                        <p>
                            If you are a resident of the European Economic Area (EEA), you have certain data protection rights:
                        </p>
                        <ul>
                            <li><strong>Right to Access:</strong> You can request copies of your personal data.</li>
                            <li><strong>Right to Rectification:</strong> You can request correction of inaccurate data.</li>
                            <li><strong>Right to Erasure:</strong> You can request that we delete your personal data.</li>
                            <li><strong>Right to Restrict Processing:</strong> You can request restriction of processing your data.</li>
                            <li><strong>Right to Data Portability:</strong> You can request transfer of your data.</li>
                        </ul>

                        <h3>5. Contact Us</h3>
                        <p>
                            If you have questions or comments about this policy, you may email us at support@c5k.org.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
