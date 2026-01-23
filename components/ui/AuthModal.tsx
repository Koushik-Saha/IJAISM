"use client";

import { Fragment } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon, ArrowRightOnRectangleIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
}

export default function AuthModal({
    isOpen,
    onClose,
    title = "Authentication Required",
    description = "Please log in to continue."
}: AuthModalProps) {
    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <DialogPanel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100">
                                <div className="absolute right-4 top-4">
                                    <button
                                        type="button"
                                        className="rounded-full bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 p-1"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-8">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 mb-5">
                                            <Image src="/favicon.svg" alt="Logo" width={32} height={32} />
                                        </div>
                                        <DialogTitle as="h3" className="text-2xl font-bold leading-6 text-gray-900 mb-3">
                                            {title}
                                        </DialogTitle>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                                {description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-3 sm:space-y-4 px-4 sm:px-8">
                                        <Link
                                            href="/login"
                                            onClick={onClose}
                                            className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200 group"
                                        >
                                            <ArrowRightOnRectangleIcon className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                            Log In to Account
                                        </Link>

                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                <div className="w-full border-t border-gray-200" />
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="bg-white px-2 text-xs text-gray-500 uppercase tracking-wider">Or</span>
                                            </div>
                                        </div>

                                        <Link
                                            href="/register"
                                            onClick={onClose}
                                            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all duration-200 group"
                                        >
                                            <UserPlusIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                                            Create New Account
                                        </Link>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-center">
                                    <p className="text-xs text-gray-500">
                                        By continuing, you agree to our <Link href="/terms" className="underline hover:text-gray-700" onClick={onClose}>Terms</Link> and <Link href="/privacy" className="underline hover:text-gray-700" onClick={onClose}>Privacy Policy</Link>.
                                    </p>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
