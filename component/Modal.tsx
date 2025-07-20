import React from "react";
import { XCircle } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          {title && (
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          )}
          <XCircle
            onClick={onClose}
            className="cursor-pointer text-red-400 ml-auto"
            size={24}
          />
        </div>
        {children}
      </div>
    </div>
  );
};
export default Modal;
