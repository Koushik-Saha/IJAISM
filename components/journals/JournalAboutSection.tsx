"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface JournalAboutSectionProps {
    journalName: string;
    description: string;
    aimsAndScope: string | null;
}

export default function JournalAboutSection({
    journalName,
    description,
    aimsAndScope,
}: JournalAboutSectionProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fallback text if aimsAndScope is empty
    const modalContent = aimsAndScope || description || "No detailed aims and scope available for this journal.";

    return (
        <>
            <div className="bg-[#e0f2fe] p-8 rounded-sm">
                <h2 className="text-3xl font-bold mb-4 font-serif text-gray-900 border-b-2 border-gray-300 pb-2 inline-block">
                    About the journal
                </h2>
                <div className="text-gray-800 leading-relaxed text-lg">
                    <p className="mb-4 line-clamp-3">
                        {description || `The ${journalName} is a premier platform dedicated to advancing knowledge...`}
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-blue-700 hover:underline font-semibold bg-transparent border-0 p-0 cursor-pointer"
                    >
                        View full aims & scope
                    </button>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <span className="text-gray-500 font-medium text-sm md:text-base pr-4">
                                {journalName}
                            </span>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto">
                            <h2 className="text-4xl font-bold mb-8 font-serif text-gray-900">
                                Aim and Scope
                            </h2>
                            <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap font-serif">
                                {modalContent.split('\n').map((paragraph, index) => (
                                    <p key={index} className="mb-4">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
