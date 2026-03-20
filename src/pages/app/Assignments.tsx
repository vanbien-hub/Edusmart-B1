import React, { useState, useEffect } from 'react';
import { dataProvider } from '../../core/provider';
import { Assignment, Submission, User } from '../../core/types';
import { FileText, CheckCircle, Clock, AlertCircle, Upload, Star, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import ReactPlayer from 'react-player';

export function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFileUrl, setSubmissionFileUrl] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await dataProvider.getCurrentUser();
    if (!currentUser) return;
    setUser(currentUser);
    
    const studentId = currentUser.id;
    const classId = currentUser.classId;

    const assigns = await dataProvider.getAssignments(classId);
    setAssignments(assigns);
    
    const subs = await dataProvider.getSubmissions(undefined, studentId);
    setSubmissions(subs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !user) return;

    await dataProvider.submitAssignment({
      assignmentId: selectedAssignment.id,
      studentId: user.id,
      content: selectedAssignment.type === 'text' ? submissionContent : undefined,
      fileUrl: selectedAssignment.type === 'file' ? submissionFileUrl : undefined,
    });
    
    await loadData();
    setSelectedAssignment(null);
  };

  const getStatus = (assignment: Assignment) => {
    const sub = submissions.find(s => s.assignmentId === assignment.id);
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    
    if (sub) {
      if (sub.score !== undefined) return { label: 'Đã chấm điểm', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle };
      return { label: 'Đã nộp', color: 'bg-blue-100 text-blue-800', icon: CheckCircle };
    }
    
    if (now > dueDate) {
      return { label: 'Đã quá hạn', color: 'bg-red-50 text-red-600', icon: AlertCircle };
    }
    
    return { label: 'Chưa làm', color: 'bg-gray-100 text-gray-800', icon: Clock };
  };

  const getEmbedUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('docs.google.com/document/d/')) {
      return url.replace('/edit', '/preview');
    }
    return url;
  };

  if (selectedAssignment) {
    const sub = submissions.find(s => s.assignmentId === selectedAssignment.id);
    const status = getStatus(selectedAssignment);
    
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <button 
          onClick={() => setSelectedAssignment(null)}
          className="text-[#0078d4] hover:text-[#006cbd] font-medium flex items-center mb-4"
        >
          &larr; Quay lại danh sách
        </button>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{selectedAssignment.title}</h2>
            <div className="flex items-center text-sm">
              <span className="text-gray-500 mr-4">Hạn nộp: {format(new Date(selectedAssignment.dueDate), 'HH:mm:ss dd/MM/yyyy')}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Prompt and Rubric Row */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Prompt */}
              <div className="flex-1 border border-gray-200 rounded-lg p-5">
                <div className="flex items-center mb-3 text-[#0078d4] font-bold text-sm uppercase tracking-wider">
                  <FileText className="w-4 h-4 mr-2" />
                  ĐỀ BÀI
                </div>
                <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedAssignment.description}
                </div>
              </div>

              {/* Rubric */}
              {selectedAssignment.rubric && (
                <div className="w-full md:w-80 bg-[#fffdf0] border border-[#f5e6b3] rounded-lg p-5 flex-shrink-0">
                  <div className="flex items-center mb-3 text-[#b48600] font-bold text-sm uppercase tracking-wider">
                    <Star className="w-4 h-4 mr-2" />
                    TIÊU CHÍ CHẤM ĐIỂM (RUBRIC)
                  </div>
                  <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedAssignment.rubric}
                  </div>
                </div>
              )}
            </div>

            {/* Submission Section */}
            <div className="pt-4">
              <div className="flex items-center mb-4 text-[#003366] font-bold text-lg">
                <Upload className="w-5 h-5 mr-2" />
                Bài làm của bạn
              </div>

              {sub ? (
                <div className="space-y-4">
                  <div className="bg-[#fffdf0] border border-[#f5e6b3] rounded-md p-4 flex items-center text-[#b48600] text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-[#f5a623] mr-3"></div>
                    Bài đã được nộp thành công và đang chờ chấm.
                  </div>

                  {sub.score !== undefined && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                      <h4 className="text-lg font-bold text-emerald-800 mb-2">Kết quả chấm điểm</h4>
                      <p className="text-2xl font-bold text-emerald-600 mb-2">{sub.score} / {selectedAssignment.maxScore}</p>
                      {sub.feedback && (
                        <p className="text-sm text-emerald-800"><strong>Lời phê:</strong> {sub.feedback}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Nội dung đã nộp:</h4>
                    {selectedAssignment.type === 'text' ? (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-gray-700 whitespace-pre-wrap">
                        {sub.content}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <a 
                          href={sub.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors group"
                        >
                          <div className="flex items-center text-[#0078d4] truncate pr-4">
                            <LinkIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{sub.fileUrl}</span>
                          </div>
                          <span className="text-xs text-gray-400 group-hover:text-gray-600 whitespace-nowrap">Click để mở</span>
                        </a>
                        
                        {/* Preview Iframe for Google Docs/Sheets/Slides */}
                        {sub.fileUrl && sub.fileUrl.includes('docs.google.com') && (
                          <div className="aspect-[4/3] w-full border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                            <iframe 
                              src={getEmbedUrl(sub.fileUrl)} 
                              className="w-full h-full"
                              title="Document Preview"
                            ></iframe>
                          </div>
                        )}

                        {/* Preview for Media (Video/Audio) */}
                        {sub.fileUrl && ReactPlayer.canPlay(sub.fileUrl) && !sub.fileUrl.includes('docs.google.com') && (
                          <div className="aspect-video w-full border border-gray-200 rounded-md overflow-hidden bg-black">
                            <ReactPlayer
                              url={sub.fileUrl}
                              width="100%"
                              height="100%"
                              controls
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {selectedAssignment.type === 'quiz' ? (
                    <div className="p-4 bg-orange-50 text-orange-800 rounded-md">
                      Tính năng làm bài trắc nghiệm đang được phát triển. Vui lòng quay lại sau.
                    </div>
                  ) : selectedAssignment.type === 'text' ? (
                    <div>
                      <textarea
                        required
                        rows={6}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0078d4] focus:ring-[#0078d4] sm:text-sm p-3 border"
                        placeholder="Nhập nội dung bài làm của bạn..."
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link file bài làm (Google Drive, YouTube, MP4...)</label>
                        <input
                          type="url"
                          required
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0078d4] focus:ring-[#0078d4] sm:text-sm p-3 border"
                          placeholder="https://..."
                          value={submissionFileUrl}
                          onChange={(e) => setSubmissionFileUrl(e.target.value)}
                        />
                      </div>
                      
                      {/* Preview before submit */}
                      {submissionFileUrl && submissionFileUrl.includes('docs.google.com') && (
                        <div className="aspect-[4/3] w-full border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                          <iframe 
                            src={getEmbedUrl(submissionFileUrl)} 
                            className="w-full h-full"
                            title="Document Preview"
                          ></iframe>
                        </div>
                      )}
                      {submissionFileUrl && ReactPlayer.canPlay(submissionFileUrl) && !submissionFileUrl.includes('docs.google.com') && (
                        <div className="aspect-video w-full border border-gray-200 rounded-md overflow-hidden bg-black">
                          <ReactPlayer
                            url={submissionFileUrl}
                            width="100%"
                            height="100%"
                            controls
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedAssignment.type !== 'quiz' && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#0078d4] hover:bg-[#006cbd] focus:outline-none"
                      >
                        Nộp bài
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Bài tập của tôi</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment) => {
          const status = getStatus(assignment);
          const sub = submissions.find(s => s.assignmentId === assignment.id);
          
          return (
            <div 
              key={assignment.id} 
              onClick={() => setSelectedAssignment(assignment)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                  {sub?.score !== undefined && (
                    <span className="font-bold text-emerald-600">{sub.score}/{assignment.maxScore}</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">{assignment.title}</h3>
                <div className="space-y-2 text-sm text-gray-600 mt-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    Hạn: {format(new Date(assignment.dueDate), 'dd/MM/yyyy HH:mm')}
                  </div>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                    Loại: {assignment.type === 'text' ? 'Tự luận' : assignment.type === 'file' ? 'Nộp file' : 'Trắc nghiệm'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {assignments.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            Không có bài tập nào được giao.
          </div>
        )}
      </div>
    </div>
  );
}
