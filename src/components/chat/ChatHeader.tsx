import type { Conversation } from '../../types/conversation.type';
import type { User } from '../../types/user.type';

interface ChatHeaderProps {
  conversation: Conversation | null;
  strangerUser?: User | null;
  onOpenSidebar?: () => void;
  onOpenAddMember?: () => void;
  onOpenNotes?: () => void;
  onOpenPolls?: () => void;
  onToggleSearch?: () => void;
  onToggleInfo?: () => void;
  isSearchOpen?: boolean;
  isInfoOpen?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  conversation, 
  strangerUser,
  onOpenSidebar,
  onOpenAddMember,
  onOpenNotes,
  onOpenPolls,
  onToggleSearch,
  onToggleInfo,
  isSearchOpen,
  isInfoOpen
}) => {
  if (!conversation && !strangerUser) {
    return (
      <div className="h-[72px] border-b border-slate-200/50 glass-panel flex items-center px-6 shadow-sm z-10 sticky top-0">
        <span className="text-slate-400 font-medium">Chưa chọn cuộc trò chuyện</span>
      </div>
    );
  }

  const isStranger = !conversation && !!strangerUser;
  const displayName = conversation ? conversation.ChatName : strangerUser?.fullName || '';
  const isGroup = conversation ? conversation.IsGroupChat : false;

  return (
    <div className="h-[72px] border-b border-white/40 glass-panel flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button onClick={onOpenSidebar} className="md:hidden p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        
        {/* Avatar */}
        <div className={`relative w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white ${
          isGroup 
          ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/20' 
          : 'bg-gradient-to-br from-sky-400 to-blue-500 shadow-blue-500/20'
        }`}>
          {(displayName || '?').charAt(0).toUpperCase()}
          {(!isGroup && (strangerUser?.isOnline || conversation)) && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
          )}
        </div>
        
        {/* Info */}
        <div className="flex flex-col justify-center">
          <h2 className="font-bold text-slate-800 text-[16px] tracking-tight">{displayName}</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isGroup ? (
              <span className="text-[12px] text-slate-500 font-medium tracking-wide">Nhóm trò chuyện</span>
            ) : (
              <span className="text-[12px] text-slate-500 font-medium tracking-wide">
                {isStranger ? (strangerUser?.isOnline ? 'Trực tuyến' : 'Ngoại tuyến') : 'Đang hoạt động'}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5">
        {isGroup && (
          <>
            <button 
              onClick={onOpenAddMember}
              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" 
              title="Thêm thành viên"
            >
              <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </button>
            <button 
              onClick={onOpenNotes}
              className="p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-all" 
              title="Ghi chú nhóm"
            >
              <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button 
              onClick={onOpenPolls}
              className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-all mr-1" 
              title="Bình chọn"
            >
              <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </button>
            <div className="w-px h-6 bg-slate-200/80 mx-2"></div>
          </>
        )}
        <button 
          onClick={onToggleSearch}
          className={`p-2.5 rounded-full transition-colors ${isSearchOpen ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100/80'}`} 
          title="Tìm kiếm tin nhắn"
        >
          <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button>
        <button 
          onClick={onToggleInfo}
          className={`p-2.5 rounded-full transition-colors ${isInfoOpen ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100/80'}`} 
          title="Thông tin"
        >
          <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>
    </div>
  );
};