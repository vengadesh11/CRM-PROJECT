import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = '2xl' }: ModalProps) {
    const maxWidthClass = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl'
    }[maxWidth];

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className={`w-full ${maxWidthClass} transform overflow-hidden rounded-xl bg-[var(--surface-panel)] border border-[var(--surface-border)] text-left align-middle shadow-2xl transition-all`}>
                                {title && (
                                    <Dialog.Title
                                        as="div"
                                        className="flex items-center justify-between border-b border-[var(--surface-border)] px-6 py-4"
                                    >
                                        <h3 className="text-lg font-bold leading-6 text-white">
                                            {title}
                                        </h3>
                                        <button
                                            onClick={onClose}
                                            className="text-[var(--text-secondary)] hover:text-white transition-colors focus:outline-none"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </Dialog.Title>
                                )}
                                <div className="px-6 py-6">
                                    {children}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
