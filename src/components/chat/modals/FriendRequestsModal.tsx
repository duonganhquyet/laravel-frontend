import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { friendApi, type FriendRequest } from '../../../api/friend.api';

interface FriendRequestsModalProps {
  onClose: () => void;
}

export const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({ onClose }) => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await friendApi.getFriendRequests();
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (requestId: string) => {
    try {
      await friendApi.acceptRequest(requestId);
      setRequests(requests.filter(r => r.id !== requestId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await friendApi.rejectRequest(requestId);
      setRequests(requests.filter(r => r.id !== requestId));
    } catch (e) {
      console.error(e);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-md overflow-hidden flex flex-col transform transition-all animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Lời mời kết bạn
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto max-h-96 custom-scrollbar bg-white">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-slate-500 font-medium">Không có lời mời kết bạn nào</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {requests.map(req => (
                <li key={req.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-blue-500 text-white flex shrink-0 items-center justify-center font-bold text-sm shadow-sm">
                      {req.sender.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-800 truncate">{req.sender.fullName}</span>
                      <span className="text-xs text-slate-500 truncate">{req.sender.email}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handleAccept(req.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 transition-all"
                    >
                      Xác nhận
                    </button>
                    <button 
                      onClick={() => handleReject(req.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-all"
                    >
                      Từ chối
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
