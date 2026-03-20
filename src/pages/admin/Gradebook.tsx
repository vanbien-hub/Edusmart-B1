import React, { useState, useEffect } from 'react';
import { dataProvider } from '../../core/provider';
import { Assignment, Class, User, Submission } from '../../core/types';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function Gradebook() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadGradebookData(selectedClassId);
    }
  }, [selectedClassId]);

  const loadClasses = async () => {
    const cls = await dataProvider.getClasses();
    setClasses(cls);
    if (cls.length > 0) {
      setSelectedClassId('all');
    }
  };

  const loadGradebookData = async (classId: string) => {
    let users: User[] = [];
    if (classId === 'all') {
      const allUsers = await dataProvider.getUsers();
      users = allUsers.filter(u => u.role === 'student');
    } else {
      users = await dataProvider.getStudentsByClass(classId);
    }
    setStudents(users);

    const assigns = await dataProvider.getAssignments(classId === 'all' ? undefined : classId);
    setAssignments(assigns);

    let allSubs: Submission[] = [];
    for (const assign of assigns) {
      const subs = await dataProvider.getSubmissions(assign.id);
      allSubs = [...allSubs, ...subs];
    }
    setSubmissions(allSubs);
  };

  const getAverageNum = (studentId: string) => {
    const studentSubs = submissions.filter(s => s.studentId === studentId && s.score !== undefined);
    if (studentSubs.length === 0) return -1;
    const total = studentSubs.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return total / studentSubs.length;
  };

  const getAverage = (studentId: string) => {
    const avg = getAverageNum(studentId);
    return avg === -1 ? '-' : avg.toFixed(1);
  };

  const sortedStudents = [...students].sort((a, b) => {
    const avgA = getAverageNum(a.id);
    const avgB = getAverageNum(b.id);
    return avgB - avgA;
  });

  const getScore = (studentId: string, assignmentId: string) => {
    const sub = submissions.find(s => s.studentId === studentId && s.assignmentId === assignmentId);
    if (!sub) return '-';
    if (sub.score === undefined) return 'Chưa chấm';
    return sub.score;
  };

  const handleExportExcel = () => {
    const data = sortedStudents.map((student, index) => {
      const avgNum = getAverageNum(student.id);
      const rank = sortedStudents.findIndex(s => getAverageNum(s.id) === avgNum) + 1;
      
      const rowData: any = {
        'STT': index + 1,
        'Học sinh': student.name,
        'Ngày sinh': student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '-',
        'Điểm TB': getAverage(student.id),
        'Xếp hạng': avgNum !== -1 ? rank : '-'
      };

      assignments.forEach(a => {
        rowData[a.title] = getScore(student.id, a.id);
      });

      return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sổ điểm");
    
    const className = selectedClassId === 'all' ? 'Tat_ca_lop' : classes.find(c => c.id === selectedClassId)?.name || 'Lop';
    XLSX.writeFile(wb, `So_diem_${className}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add font for Vietnamese support if possible, but default will work for basic characters
    const className = selectedClassId === 'all' ? 'Tất cả các lớp' : classes.find(c => c.id === selectedClassId)?.name || '';
    doc.text(`Sổ điểm - ${className}`, 14, 15);

    const tableColumn = ["STT", "Học sinh", "Ngày sinh", "Điểm TB", "Xếp hạng", ...assignments.map(a => a.title)];
    const tableRows = sortedStudents.map((student, index) => {
      const avgNum = getAverageNum(student.id);
      const rank = sortedStudents.findIndex(s => getAverageNum(s.id) === avgNum) + 1;
      
      const rowData = [
        index + 1,
        student.name,
        student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '-',
        getAverage(student.id),
        avgNum !== -1 ? rank : '-',
        ...assignments.map(a => getScore(student.id, a.id))
      ];
      return rowData;
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { font: 'helvetica', fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] } // emerald-500
    });

    const fileName = selectedClassId === 'all' ? 'Tat_ca_lop' : classes.find(c => c.id === selectedClassId)?.name || 'Lop';
    doc.save(`So_diem_${fileName}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Sổ điểm (Gradebook)</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Download className="w-4 h-4 mr-2 text-gray-500" />
              Tải
              <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
            </button>

            {isExportMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsExportMenuOpen(false)}
                ></div>
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <button
                      onClick={() => {
                        handleExportExcel();
                        setIsExportMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      role="menuitem"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-3 text-emerald-600" />
                      Xuất Excel
                    </button>
                    <button
                      onClick={() => {
                        handleExportPDF();
                        setIsExportMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      role="menuitem"
                    >
                      <FileText className="w-4 h-4 mr-3 text-red-600" />
                      Xuất PDF
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <select
            className="p-2 border rounded-md outline-none focus:border-emerald-500 bg-white shadow-sm"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="all">Tất cả các lớp</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-16">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[64px] bg-gray-50 z-10">
                  Học sinh
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày sinh
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50">
                  Điểm TB
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50">
                  Xếp hạng
                </th>
                {assignments.map(a => (
                  <th key={a.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[150px] truncate" title={a.title}>
                    {a.title}
                    <div className="text-[10px] text-gray-400 font-normal mt-1">Max: {a.maxScore}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStudents.map((student, index) => {
                const avgNum = getAverageNum(student.id);
                // Calculate rank based on average score
                // Students with same score get same rank
                const rank = sortedStudents.findIndex(s => getAverageNum(s.id) === avgNum) + 1;
                
                return (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500 sticky left-0 bg-white z-10 border-r border-gray-100">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-[64px] bg-white z-10 border-r border-gray-100">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 text-center bg-emerald-50/30">
                    {getAverage(student.id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-center bg-blue-50/30">
                    {avgNum !== -1 ? rank : '-'}
                  </td>
                  {assignments.map(a => {
                    const score = getScore(student.id, a.id);
                    return (
                      <td key={a.id} className={`px-6 py-4 whitespace-nowrap text-sm text-center ${score === 'Chưa chấm' ? 'text-yellow-600 italic' : 'text-gray-900'}`}>
                        {score}
                      </td>
                    );
                  })}
                </tr>
              )})}
              {students.length === 0 && (
                <tr>
                  <td colSpan={assignments.length + 5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Không có học sinh nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
